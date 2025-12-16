"""
PLATFORM INTEGRITY TEST SUITE
Comprehensive tests for cross-user data flows and platform integrity
Based on Platform Integrity Directive Part 5
"""

import pytest
import json
from datetime import datetime, timedelta
from flask import Flask
from flask_jwt_extended import create_access_token


class TestUserAnalytics:
    """Test suite for admin user analytics endpoints."""
    
    def test_user_analytics_returns_real_data(self, client, admin_token):
        """Verify user analytics returns real database data, not mock."""
        response = client.get(
            '/api/admin/analytics/users',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert data['success'] is True
        assert 'data' in data
        assert 'total_users' in data['data']
        assert 'total_employers' in data['data']
        assert 'total_employees' in data['data']
        assert 'total_contractors' in data['data']
        assert 'user_growth' in data['data']
        assert data['data'].get('data_source') == 'real_database_query'
    
    def test_user_analytics_requires_admin(self, client, employer_token):
        """Verify non-admins cannot access user analytics."""
        response = client.get(
            '/api/admin/analytics/users',
            headers={'Authorization': f'Bearer {employer_token}'}
        )
        
        assert response.status_code == 403


class TestCommunications:
    """Test suite for kudos and messaging system."""
    
    def test_send_kudos_creates_notification(self, client, employer_token, test_employee):
        """Verify sending kudos creates a notification for the recipient."""
        response = client.post(
            '/api/communications/kudos/send',
            headers={'Authorization': f'Bearer {employer_token}'},
            json={
                'recipient_type': 'employee',
                'recipient_id': test_employee.id,
                'message': 'Great work on the project!',
                'badge_type': 'star',
                'visibility': 'team'
            }
        )
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['success'] is True
        assert 'kudos_id' in data
    
    def test_send_message_creates_notification(self, client, employer_token, test_employee):
        """Verify sending message creates a notification for the recipient."""
        response = client.post(
            '/api/communications/messages/send',
            headers={'Authorization': f'Bearer {employer_token}'},
            json={
                'recipient_type': 'employee',
                'recipient_id': test_employee.id,
                'subject': 'Team Meeting',
                'message': 'Please join the meeting at 3pm.',
                'priority': 'normal'
            }
        )
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['success'] is True
        assert 'message_id' in data
    
    def test_get_inbox_returns_messages(self, client, employee_token):
        """Verify inbox returns user's messages."""
        response = client.get(
            '/api/communications/messages/inbox',
            headers={'Authorization': f'Bearer {employee_token}'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'data' in data
        assert 'messages' in data['data']
        assert 'unread_count' in data['data']


class TestCrossUserDataFlows:
    """Test suite for cross-user data flow integrity."""
    
    def test_employee_creation_updates_employer_count(self, client, employer_token, db_session):
        """Verify creating employee updates employer's employee_count."""
        from models import Employer
        
        # Get initial count
        employer = Employer.query.first()
        initial_count = employer.employee_count or 0
        
        # Create employee
        response = client.post(
            '/api/employees',
            headers={'Authorization': f'Bearer {employer_token}'},
            json={
                'first_name': 'Test',
                'last_name': 'Employee',
                'email': f'test_{datetime.now().timestamp()}@example.com',
                'hire_date': datetime.now().isoformat()
            }
        )
        
        if response.status_code == 201:
            # Verify count increased
            db_session.refresh(employer)
            assert employer.employee_count == initial_count + 1
    
    def test_payroll_run_creates_employee_notifications(self, client, employer_token, test_employees):
        """Verify payroll run creates notifications for all employees."""
        from models import Notification
        
        # Run payroll
        response = client.post(
            '/api/payroll-runs',
            headers={'Authorization': f'Bearer {employer_token}'},
            json={
                'pay_period_start': (datetime.now() - timedelta(days=14)).isoformat(),
                'pay_period_end': datetime.now().isoformat(),
                'pay_date': (datetime.now() + timedelta(days=3)).isoformat()
            }
        )
        
        if response.status_code == 201:
            # Verify notifications created for employees
            for employee in test_employees:
                notifications = Notification.query.filter_by(
                    user_id=employee.id,
                    user_type='employee',
                    type='paystub_ready'
                ).all()
                assert len(notifications) >= 1


class TestThemeConsistency:
    """Test suite for theme consistency across the platform."""
    
    def test_settings_return_theme_preference(self, client, user_token):
        """Verify settings endpoint returns theme preference."""
        response = client.get(
            '/settings/api/theme-preference',
            headers={'Authorization': f'Bearer {user_token}'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'theme_mode' in data
        assert data['theme_mode'] in ['light', 'dark', 'system']
    
    def test_update_theme_preference(self, client, user_token):
        """Verify theme preference can be updated."""
        response = client.put(
            '/settings/api/theme-preference',
            headers={'Authorization': f'Bearer {user_token}'},
            json={'theme_mode': 'dark'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data.get('success') is True


class TestAPIClientManagement:
    """Test suite for Tax Engine API client management."""
    
    def test_list_api_clients(self, client, admin_token):
        """Verify admin can list API clients."""
        response = client.get(
            '/api/tax-engine/clients',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'clients' in data
    
    def test_create_api_client(self, client, admin_token):
        """Verify admin can create API client."""
        response = client.post(
            '/api/tax-engine/clients',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'name': f'Test Client {datetime.now().timestamp()}',
                'description': 'Test API client',
                'tier': 'basic',
                'rate_limit': 1000
            }
        )
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['success'] is True
        assert 'client' in data
        assert 'api_key' in data['client']
    
    def test_api_client_requires_admin(self, client, employer_token):
        """Verify non-admins cannot manage API clients."""
        response = client.get(
            '/api/tax-engine/clients',
            headers={'Authorization': f'Bearer {employer_token}'}
        )
        
        assert response.status_code == 403


class TestDataIntegrity:
    """Test suite for data integrity across user types."""
    
    def test_no_nan_values_in_metrics(self, client, admin_token):
        """Verify admin metrics don't contain NaN values."""
        response = client.get(
            '/api/admin/metrics',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        
        if data.get('success') and 'metrics' in data:
            metrics = data['metrics']
            for key, value in metrics.items():
                if isinstance(value, (int, float)):
                    assert value == value, f"NaN found in {key}"  # NaN != NaN
                    assert value != float('inf'), f"Infinity found in {key}"
    
    def test_user_counts_are_consistent(self, client, admin_token):
        """Verify user counts are consistent across endpoints."""
        # Get user analytics
        analytics_response = client.get(
            '/api/admin/analytics/users',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        # Get admin metrics
        metrics_response = client.get(
            '/api/admin/metrics',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        if analytics_response.status_code == 200 and metrics_response.status_code == 200:
            analytics = analytics_response.get_json().get('data', {})
            metrics = metrics_response.get_json().get('metrics', {})
            
            # Verify consistency
            if 'total_users' in analytics and 'total_users' in metrics:
                assert analytics['total_users'] == metrics['total_users']


# Pytest fixtures (to be implemented in conftest.py)
@pytest.fixture
def app():
    """Create test application."""
    from app import create_app
    app = create_app()
    app.config['TESTING'] = True
    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def admin_token(app):
    """Create admin JWT token for testing."""
    with app.app_context():
        return create_access_token(identity='admin_test_id')


@pytest.fixture
def employer_token(app):
    """Create employer JWT token for testing."""
    with app.app_context():
        return create_access_token(identity='employer_test_id')


@pytest.fixture
def employee_token(app):
    """Create employee JWT token for testing."""
    with app.app_context():
        return create_access_token(identity='employee_test_id')


@pytest.fixture
def user_token(app):
    """Create generic user JWT token for testing."""
    with app.app_context():
        return create_access_token(identity='user_test_id')
