def format_response(data=None, message="Success", status_code=200):
    """Format standardized API response structure."""
    return {
        "status": status_code,
        "message": message,
        "data": data,
    }
