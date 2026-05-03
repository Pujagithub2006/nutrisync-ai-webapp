#!/usr/bin/env python3
"""
Google Fit Data Ingestion Script
Fetches health data from Google Fit API and sends it to backend
"""

import os
import json
import asyncio
import aiohttp
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Union
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GoogleFitDataIngestor:
    def __init__(self, backend_url: str = "http://localhost:8000", auth_token: str = None):
        self.backend_url = backend_url
        self.auth_token = auth_token
        self.google_client_id = os.getenv("GOOGLE_CLIENT_ID", "464284139607-i4qeo3dpg1pvrqs1kai1qu7n6njd95ak.apps.googleusercontent.com")
        self.scopes = [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email", 
            "https://www.googleapis.com/auth/fitness.activity.read",
            "https://www.googleapis.com/auth/fitness.body.read",
            "https://www.googleapis.com/auth/fitness.heart_rate.read",
            "https://www.googleapis.com/auth/fitness.sleep.read",
            "https://www.googleapis.com/auth/fitness.blood_pressure.read",
        ]
        
    async def get_google_access_token(self) -> str:
        """Get Google OAuth2 access token"""
        token = os.getenv("GOOGLE_ACCESS_TOKEN")
        if token:
            return token
            
        raise ValueError(
            "Google access token required. Set GOOGLE_ACCESS_TOKEN environment variable "
            "or implement OAuth2 flow. Get token from: https://developers.google.com/oauthplayground/"
        )
    
    async def fetch_google_fit_data(self, access_token: str, data_type: str, days: int = 30) -> Dict:
        """Fetch specific data type from Google Fit API"""
        
        fitness_api = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate"
        day_ms = 86400000
        now_ms = int((datetime.now(timezone.utc).timestamp() * 1000))
        start_time_ms = now_ms - (days * day_ms)
        
        logger.info(f"Fetching {data_type} from {datetime.fromtimestamp(start_time_ms/1000).strftime('%Y-%m-%d')} to {datetime.fromtimestamp(now_ms/1000).strftime('%Y-%m-%d')}")
        
        payload = {
            "aggregateBy": [{"dataTypeName": data_type}],
            "bucketByTime": {"durationMillis": day_ms},
            "startTimeMillis": start_time_ms,
            "endTimeMillis": now_ms,
        }
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(fitness_api, headers=headers, json=payload) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    logger.error(f"Google Fit API error for {data_type}: {response.status} - {error_text}")
                    return {}
    
    async def fetch_all_health_data(self, access_token: str) -> Dict[str, Any]:
        """Fetch all health data from Google Fit"""
        
        data_types = {
            "steps": "com.google.step_count.delta",
            "calories": "com.google.calories.expended", 
            "heart_rate": "com.google.heart_rate.bpm",
            "weight": "com.google.weight",
            "blood_pressure": "com.google.blood_pressure",
            "sleep": "com.google.sleep.segment",
            "active_minutes": "com.google.active_minutes"
        }
        
        logger.info("Fetching health data from Google Fit...")
        results = {}
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            for key, data_type in data_types.items():
                # Use different time ranges for different data types
                days = 30 if key in ["weight"] else 7
                task = self.fetch_google_fit_data(access_token, data_type, days)
                tasks.append((key, task))
            
            for key, task in tasks:
                try:
                    result = await task
                    results[key] = result
                    bucket_count = len(result.get('bucket', []))
                    logger.info(f"Fetched {key}: {bucket_count} data points")
                    
                    # Debug: Log raw data structure for first bucket
                    if bucket_count > 0:
                        logger.info(f"Raw {key} data structure: {json.dumps(result['bucket'][0], indent=2)}")
                        
                except Exception as e:
                    logger.error(f"Failed to fetch {key}: {e}")
                    results[key] = {}
        
        return results
    
    def safe_get_nested_value(self, data: Dict, path: List[str], default: Any = None) -> Any:
        """Safely get nested value from dictionary"""
        try:
            current = data
            for key in path:
                if isinstance(current, dict) and key in current:
                    current = current[key]
                elif isinstance(current, list) and len(current) > 0:
                    current = current[0]
                else:
                    return default
            return current
        except (IndexError, KeyError, TypeError):
            return default
    
    def has_data_points(self, data: Dict) -> bool:
        """Check if Google Fit response has actual data points"""
        try:
            buckets = data.get('bucket', [])
            for bucket in buckets:
                datasets = bucket.get('dataset', [])
                for dataset in datasets:
                    points = dataset.get('point', [])
                    if len(points) > 0:
                        return True
            return False
        except:
            return False
    
    def parse_steps_data(self, data: Dict) -> List[Dict]:
        """Parse steps data from Google Fit response"""
        steps = []
        
        if not self.has_data_points(data):
            logger.info("No step data points found in Google Fit response")
            return steps
            
        buckets = data.get('bucket', [])
        
        for bucket in buckets:
            start_time = bucket.get('startTimeMillis')
            
            # Safe parsing with multiple fallback paths
            value = self.safe_get_nested_value(bucket, ['dataset', 0, 'point', 0, 'value', 0, 'intVal'])
            
            if start_time and value and value > 0:
                date = datetime.fromtimestamp(int(start_time) / 1000, tz=timezone.utc)
                steps.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'value': value
                })
                logger.debug(f"Steps parsed: {value} on {date.strftime('%Y-%m-%d')}")
        
        return steps
    
    def parse_calories_data(self, data: Dict) -> List[Dict]:
        """Parse calories data from Google Fit response"""
        calories = []
        buckets = data.get('bucket', [])
        
        for bucket in buckets:
            start_time = bucket.get('startTimeMillis')
            
            # Safe parsing with multiple fallback paths
            value = self.safe_get_nested_value(bucket, ['dataset', 0, 'point', 0, 'value', 0, 'fpVal'])
            
            if start_time and value and value > 0:
                date = datetime.fromtimestamp(int(start_time) / 1000, tz=timezone.utc)
                calories.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'value': round(float(value), 1)
                })
                logger.debug(f"Calories parsed: {value} on {date.strftime('%Y-%m-%d')}")
        
        return calories
    
    def parse_heart_rate_data(self, data: Dict) -> List[Dict]:
        """Parse heart rate data from Google Fit response"""
        heart_rates = []
        buckets = data.get('bucket', [])
        
        for bucket in buckets:
            start_time = bucket.get('startTimeMillis')
            
            # Safe parsing with multiple fallback paths
            values = self.safe_get_nested_value(bucket, ['dataset', 0, 'point', 0, 'value'])
            
            if start_time and values and len(values) >= 1:
                date = datetime.fromtimestamp(int(start_time) / 1000, tz=timezone.utc)
                
                # Extract avg, min, max if available
                avg = round(float(values[0].get('fpVal', 0))) if len(values) > 0 else 0
                min_val = round(float(values[1].get('fpVal', 0))) if len(values) > 1 else avg
                max_val = round(float(values[2].get('fpVal', 0))) if len(values) > 2 else avg
                
                heart_rates.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'avg': avg,
                    'min': min_val,
                    'max': max_val
                })
                logger.debug(f"Heart rate parsed: avg={avg}, min={min_val}, max={max_val} on {date.strftime('%Y-%m-%d')}")
        
        return heart_rates
    
    def parse_weight_data(self, data: Dict) -> List[Dict]:
        """Parse weight data from Google Fit response"""
        weights = []
        buckets = data.get('bucket', [])
        
        for bucket in buckets:
            start_time = bucket.get('startTimeMillis')
            
            # Safe parsing with multiple fallback paths
            value = self.safe_get_nested_value(bucket, ['dataset', 0, 'point', 0, 'value', 0, 'fpVal'])
            
            if start_time and value and value > 0:
                date = datetime.fromtimestamp(int(start_time) / 1000, tz=timezone.utc)
                weights.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'value': round(float(value), 1)
                })
                logger.debug(f"Weight parsed: {value} kg on {date.strftime('%Y-%m-%d')}")
        
        return weights
    
    def parse_blood_pressure_data(self, data: Dict) -> List[Dict]:
        """Parse blood pressure data from Google Fit response"""
        blood_pressures = []
        buckets = data.get('bucket', [])
        
        for bucket in buckets:
            start_time = bucket.get('startTimeMillis')
            
            # Safe parsing with multiple fallback paths
            values = self.safe_get_nested_value(bucket, ['dataset', 0, 'point', 0, 'value'])
            
            if start_time and values and len(values) >= 2:
                date = datetime.fromtimestamp(int(start_time) / 1000, tz=timezone.utc)
                
                # Extract systolic and diastolic
                systolic = round(float(values[0].get('fpVal', 0))) if len(values) > 0 else 0
                diastolic = round(float(values[1].get('fpVal', 0))) if len(values) > 1 else 0
                
                if systolic > 0 and diastolic > 0:
                    blood_pressures.append({
                        'date': date.strftime('%Y-%m-%d'),
                        'systolic': systolic,
                        'diastolic': diastolic
                    })
                    logger.debug(f"Blood pressure parsed: {systolic}/{diastolic} on {date.strftime('%Y-%m-%d')}")
        
        return blood_pressures
    
    def parse_sleep_data(self, data: Dict) -> float:
        """Parse sleep data from Google Fit response"""
        total_minutes = 0
        buckets = data.get('bucket', [])
        
        for bucket in buckets:
            datasets = bucket.get('dataset', [])
            for dataset in datasets:
                points = dataset.get('point', [])
                for point in points:
                    # Safe parsing
                    sleep_type = self.safe_get_nested_value(point, ['value', 0, 'intVal'])
                    
                    if sleep_type in [72, 73]:  # Sleep types (72=sleep, 73=sleep_light)
                        start_nanos = int(point.get('startTimeNanos', 0))
                        end_nanos = int(point.get('endTimeNanos', 0))
                        
                        if end_nanos > start_nanos:
                            duration_minutes = (end_nanos - start_nanos) / 1e9 / 60
                            total_minutes += duration_minutes
                            logger.debug(f"Sleep segment: {duration_minutes:.1f} minutes")
        
        sleep_hours = round(total_minutes / 60, 1)
        logger.debug(f"Total sleep parsed: {sleep_hours} hours")
        return sleep_hours
    
    def parse_active_minutes_data(self, data: Dict) -> List[Dict]:
        """Parse active minutes data from Google Fit response"""
        active_minutes = []
        buckets = data.get('bucket', [])
        
        for bucket in buckets:
            start_time = bucket.get('startTimeMillis')
            
            # Safe parsing with multiple fallback paths
            value = self.safe_get_nested_value(bucket, ['dataset', 0, 'point', 0, 'value', 0, 'intVal'])
            
            if start_time and value and value > 0:
                date = datetime.fromtimestamp(int(start_time) / 1000, tz=timezone.utc)
                active_minutes.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'value': value
                })
                logger.debug(f"Active minutes parsed: {value} on {date.strftime('%Y-%m-%d')}")
        
        return active_minutes
    
    def transform_for_backend(self, health_data: Dict[str, Any]) -> List[Dict]:
        """Transform Google Fit data to backend schema"""
        
        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        
        # Parse each data type with error handling
        try:
            steps_data = self.parse_steps_data(health_data.get('steps', {}))
        except Exception as e:
            logger.error(f"Error parsing steps data: {e}")
            steps_data = []
            
        try:
            calories_data = self.parse_calories_data(health_data.get('calories', {}))
        except Exception as e:
            logger.error(f"Error parsing calories data: {e}")
            calories_data = []
            
        try:
            heart_rate_data = self.parse_heart_rate_data(health_data.get('heart_rate', {}))
        except Exception as e:
            logger.error(f"Error parsing heart rate data: {e}")
            heart_rate_data = []
            
        try:
            weight_data = self.parse_weight_data(health_data.get('weight', {}))
        except Exception as e:
            logger.error(f"Error parsing weight data: {e}")
            weight_data = []
            
        try:
            blood_pressure_data = self.parse_blood_pressure_data(health_data.get('blood_pressure', {}))
        except Exception as e:
            logger.error(f"Error parsing blood pressure data: {e}")
            blood_pressure_data = []
            
        try:
            sleep_hours = self.parse_sleep_data(health_data.get('sleep', {}))
        except Exception as e:
            logger.error(f"Error parsing sleep data: {e}")
            sleep_hours = 0
            
        try:
            active_minutes_data = self.parse_active_minutes_data(health_data.get('active_minutes', {}))
        except Exception as e:
            logger.error(f"Error parsing active minutes data: {e}")
            active_minutes_data = []
        
        # Get today's data with fallbacks
        today_steps = next((s['value'] for s in steps_data if s['date'] == today), 0)
        today_calories = next((c['value'] for c in calories_data if c['date'] == today), 0)
        today_heart_rate = next((hr['avg'] for hr in heart_rate_data if hr['date'] == today), 0)
        today_weight = next((w['value'] for w in weight_data if w['date'] == today), 0)
        today_active_minutes = next((am['value'] for am in active_minutes_data if am['date'] == today), 0)
        today_blood_pressure = next((bp for bp in blood_pressure_data if bp['date'] == today), None)
        
        # Log parsed values for debugging
        logger.info(f"📊 Parsed values for {today}:")
        logger.info(f"Steps: {today_steps}")
        logger.info(f"Calories: {today_calories}")
        logger.info(f"Heart Rate: {today_heart_rate} bpm")
        logger.info(f"Weight: {today_weight} kg")
        logger.info(f"Sleep: {sleep_hours} hours")
        logger.info(f"Active Minutes: {today_active_minutes}")
        if today_blood_pressure:
            logger.info(f"Blood Pressure: {today_blood_pressure['systolic']}/{today_blood_pressure['diastolic']}")
        else:
            logger.info("Blood Pressure: Not available")
        
        # Create payload for backend
        payload = {
            "heart_rate_bpm": today_heart_rate if today_heart_rate > 0 else None,
            "hrv_ms": None,
            "spo2": None,
            "sleep_hours": sleep_hours if sleep_hours > 0 else None,
            "sleep_quality": int(min(max(sleep_hours * 1.14, 1), 10)) if sleep_hours > 0 else None,
            "steps": today_steps if today_steps > 0 else None,
            "active_calories": int(today_calories) if today_calories > 0 else None,
            "weight_kg": today_weight if today_weight > 0 else None,
            "water_ml": None,
            "blood_glucose_mmol": None,
            "stress_score": None,
            "source": "google_fit_script",
            "logged_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Check if payload has any meaningful data
        has_data = any([
            payload["heart_rate_bpm"],
            payload["sleep_hours"],
            payload["steps"],
            payload["active_calories"],
            payload["weight_kg"]
        ])
        
        if not has_data:
            logger.warning("⚠️ No meaningful health data to send to backend")
            return []
        
        logger.info(f"📤 Sending payload to backend: {json.dumps(payload, indent=2)}")
        return [payload]
    
    async def send_to_backend(self, payloads: List[Dict]) -> bool:
        """Send transformed data to backend"""
        
        if not self.auth_token:
            logger.error("No auth token provided for backend")
            return False
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.auth_token}"
        }
        
        success_count = 0
        async with aiohttp.ClientSession() as session:
            for payload in payloads:
                try:
                    async with session.post(
                        f"{self.backend_url}/v1/physiology/sync",
                        headers=headers,
                        json=payload
                    ) as response:
                        if response.status == 201:
                            result = await response.json()
                            logger.info(f"✅ Data ingested successfully: {result.get('log_id')}")
                            success_count += 1
                        else:
                            error_text = await response.text()
                            logger.error(f"❌ Backend error: {response.status} - {error_text}")
                            
                except Exception as e:
                    logger.error(f"❌ Failed to send data to backend: {e}")
        
        return success_count > 0
    
    async def run_ingestion(self) -> bool:
        """Main ingestion process"""
        
        try:
            # Get Google access token
            access_token = await self.get_google_access_token()
            logger.info("✅ Got Google access token")
            
            # Fetch health data
            health_data = await self.fetch_all_health_data(access_token)
            logger.info("✅ Fetched health data from Google Fit")
            
            # Transform data
            payloads = self.transform_for_backend(health_data)
            logger.info(f"✅ Transformed data: {len(payloads)} records")
            
            # Send to backend
            success = await self.send_to_backend(payloads)
            if success:
                logger.info("🎉 Data ingestion completed successfully!")
            else:
                logger.error("❌ Data ingestion failed")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Ingestion process failed: {e}")
            return False

async def main():
    """Main function"""
    
    # Configuration
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    auth_token = os.getenv("BACKEND_AUTH_TOKEN")
    
    if not auth_token:
        logger.error("❌ BACKEND_AUTH_TOKEN environment variable required")
        logger.info("Set it: export BACKEND_AUTH_TOKEN=your_token_here")
        return
    
    # Create and run ingestor
    ingestor = GoogleFitDataIngestor(backend_url=backend_url, auth_token=auth_token)
    await ingestor.run_ingestion()

if __name__ == "__main__":
    asyncio.run(main())
