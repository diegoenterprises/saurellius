"""
WEATHER ROUTES
Weather and location data endpoints for dashboard
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.weather_service import weather_service

weather_bp = Blueprint('weather', __name__)


@weather_bp.route('/api/weather', methods=['GET'])
@jwt_required()
def get_weather():
    """
    Get weather data based on user's IP address.
    Returns current weather, forecast, location, and time info.
    """
    # Get client IP address
    ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
    
    # Handle multiple IPs in X-Forwarded-For (take the first one)
    if ip_address and ',' in ip_address:
        ip_address = ip_address.split(',')[0].strip()
    
    # Get full weather data
    data = weather_service.get_full_weather_data(ip_address)
    
    if data['status'] == 'error':
        return jsonify({
            'success': False,
            'message': data['message']
        }), 400
    
    return jsonify({
        'success': True,
        'data': data
    }), 200


@weather_bp.route('/api/weather/location', methods=['GET'])
@jwt_required()
def get_location():
    """Get user's location based on IP address."""
    ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
    
    if ip_address and ',' in ip_address:
        ip_address = ip_address.split(',')[0].strip()
    
    location = weather_service.get_location_from_ip(ip_address)
    
    if not location:
        return jsonify({
            'success': False,
            'message': 'Could not determine location'
        }), 400
    
    return jsonify({
        'success': True,
        'location': location
    }), 200


@weather_bp.route('/api/weather/by-coords', methods=['GET'])
@jwt_required()
def get_weather_by_coords():
    """Get weather for specific coordinates (manual location override)."""
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    
    if lat is None or lon is None:
        return jsonify({
            'success': False,
            'message': 'Latitude and longitude are required'
        }), 400
    
    weather = weather_service.get_weather(lat, lon)
    season = weather_service.get_season(lat)
    
    if not weather:
        return jsonify({
            'success': False,
            'message': 'Could not fetch weather data'
        }), 400
    
    return jsonify({
        'success': True,
        'weather': weather,
        'season': season
    }), 200


@weather_bp.route('/api/time', methods=['GET'])
@jwt_required()
def get_time():
    """Get current time info for user's timezone."""
    timezone = request.args.get('timezone', 'UTC')
    
    time_data = weather_service.get_time_and_timezone(timezone)
    
    return jsonify({
        'success': True,
        'time': time_data
    }), 200
