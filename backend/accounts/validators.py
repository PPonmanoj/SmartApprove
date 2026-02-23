import re
from django.core.exceptions import ValidationError

def validate_mobile_number(value):
    """Validate mobile number: exactly 10 digits"""
    if not value:
        return
    
    # Remove any spaces, dashes, or parentheses
    cleaned = re.sub(r'[\s\-\(\)]', '', value)
    
    # Check if it's exactly 10 digits
    if not re.match(r'^\d{10}$', cleaned):
        raise ValidationError('Mobile number must be exactly 10 digits.')
    
    return cleaned


def validate_email(value):
    """Validate email format"""
    if not value:
        return
    
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, value):
        raise ValidationError('Enter a valid email address.')
    
    return value.lower()


def validate_roll_number(value):
    """Validate roll number format (alphanumeric, 4-20 chars)"""
    if not value:
        raise ValidationError('Roll number is required.')
    
    if not re.match(r'^[A-Za-z0-9]{4,20}$', value):
        raise ValidationError('Roll number must be 4-20 alphanumeric characters.')
    
    return value.upper()


def validate_pdf_file(file):
    """Validate uploaded file is a PDF"""
    if not file:
        raise ValidationError('File is required.')
    
    # Check extension
    if not file.name.lower().endswith('.pdf'):
        raise ValidationError('Only PDF files are allowed.')
    
    # Check MIME type
    if hasattr(file, 'content_type') and file.content_type != 'application/pdf':
        raise ValidationError('Invalid file type. Only PDF files are allowed.')
    
    # Check file size (max 10MB)
    if file.size > 10 * 1024 * 1024:
        raise ValidationError('File size must be less than 10MB.')
    
    return file


def validate_date_range(start_date, end_date):
    """Validate that end_date is after start_date"""
    if start_date and end_date:
        if end_date <= start_date:
            raise ValidationError('End date must be after start date.')
    return True
