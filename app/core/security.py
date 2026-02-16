"""
Security Module
Input validation, sanitization, and rate limiting
"""
import re
import bleach
from typing import Optional
from email_validator import validate_email, EmailNotValidError
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request, HTTPException, status
from app.core.logging import get_logger, security_logger

logger = get_logger(__name__)


class InputValidator:
    """Validates and sanitizes user inputs"""
    
    @staticmethod
    def validate_order_id(order_id: str) -> bool:
        """
        Validate order ID format: ORD-XXXXXX
        
        Args:
            order_id: Order ID to validate
            
        Returns:
            bool: True if valid format
        """
        pattern = r'^ORD-\d{6}$'
        is_valid = bool(re.match(pattern, order_id))
        
        if not is_valid:
            security_logger.warning(
                "Invalid order ID format",
                extra={"order_id": order_id}
            )
        
        return is_valid
    
    @staticmethod
    def validate_email_address(email: str) -> bool:
        """
        Validate email address format
        
        Args:
            email: Email address to validate
            
        Returns:
            bool: True if valid email
        """
        try:
            # Validate and normalize
            validation = validate_email(email, check_deliverability=False)
            return True
        except EmailNotValidError as e:
            security_logger.warning(
                "Invalid email format",
                extra={"email": email, "error": str(e)}
            )
            return False
    
    @staticmethod
    def validate_discount_code(code: str) -> bool:
        """
        Validate discount code format
        
        Args:
            code: Discount code to validate
            
        Returns:
            bool: True if valid format
        """
        # Alphanumeric, 3-20 characters
        pattern = r'^[A-Z0-9]{3,20}$'
        is_valid = bool(re.match(pattern, code.upper()))
        
        if not is_valid:
            security_logger.warning(
                "Invalid discount code format",
                extra={"code": code}
            )
        
        return is_valid
    
    @staticmethod
    def validate_message_length(message: str, max_length: int = 2000) -> bool:
        """
        Validate message length
        
        Args:
            message: User message
            max_length: Maximum allowed length
            
        Returns:
            bool: True if within limits
        """
        is_valid = len(message) <= max_length
        
        if not is_valid:
            security_logger.warning(
                "Message exceeds length limit",
                extra={"length": len(message), "max": max_length}
            )
        
        return is_valid
    
    @staticmethod
    def sanitize_query(query: str) -> str:
        """
        Sanitize user query to prevent XSS and injection attacks
        
        Args:
            query: User query string
            
        Returns:
            str: Sanitized query
        """
        # Remove HTML tags and dangerous content
        cleaned = bleach.clean(
            query,
            tags=[],  # No tags allowed
            attributes={},
            strip=True
        )
        
        # Remove SQL injection patterns
        sql_patterns = [
            r'(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b)',
            r'(--|;|\/\*|\*\/)',
            r'(\bor\b\s+\d+\s*=\s*\d+)',
            r'(\band\b\s+\d+\s*=\s*\d+)'
        ]
        
        for pattern in sql_patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        # Trim whitespace
        cleaned = cleaned.strip()
        
        if cleaned != query:
            security_logger.warning(
                "Query sanitized",
                extra={"original_length": len(query), "cleaned_length": len(cleaned)}
            )
        
        return cleaned
    
    @staticmethod
    def validate_product_search_query(query: str) -> bool:
        """
        Validate product search query
        
        Args:
            query: Search query
            
        Returns:
            bool: True if valid
        """
        # Must be 2-200 characters after sanitization
        sanitized = InputValidator.sanitize_query(query)
        is_valid = 2 <= len(sanitized) <= 200
        
        if not is_valid:
            security_logger.warning(
                "Invalid search query length",
                extra={"length": len(sanitized)}
            )
        
        return is_valid
    
    @staticmethod
    def validate_session_id(session_id: str) -> bool:
        """
        Validate session ID format
        
        Args:
            session_id: Session ID to validate
            
        Returns:
            bool: True if valid format
        """
        # Allow alphanumeric, hyphens, underscores (8-64 chars)
        pattern = r'^[a-zA-Z0-9_-]{8,64}$'
        is_valid = bool(re.match(pattern, session_id))
        
        if not is_valid:
            security_logger.warning(
                "Invalid session ID format",
                extra={"session_id": session_id}
            )
        
        return is_valid


class SecurityValidator:
    """Additional security checks"""
    
    @staticmethod
    def check_suspicious_patterns(message: str) -> bool:
        """
        Check for suspicious patterns that might indicate attacks
        
        Args:
            message: User message
            
        Returns:
            bool: True if message appears safe
        """
        suspicious_patterns = [
            # Prompt injection attempts
            r'ignore\s+(previous|above|all)\s+instructions?',
            r'system\s+prompt',
            r'you\s+are\s+now',
            r'roleplay\s+as',
            r'pretend\s+(to\s+be|you\s+are)',
            
            # Attempting to leak system info
            r'show\s+me\s+(your|the)\s+(prompt|instructions|system)',
            r'what\s+(are|is)\s+your\s+(instructions|rules|prompt)',
            
            # Command injection
            r'`.*`',
            r'\$\(.*\)',
            r'&&|\|\|',
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                security_logger.warning(
                    "Suspicious pattern detected",
                    extra={"pattern": pattern, "message_preview": message[:100]}
                )
                return False
        
        return True
    
    @staticmethod
    def validate_request_origin(request: Request, allowed_origins: list) -> bool:
        """
        Validate request origin for CORS
        
        Args:
            request: FastAPI request
            allowed_origins: List of allowed origins
            
        Returns:
            bool: True if origin is allowed
        """
        origin = request.headers.get("origin", "")
        
        if not origin:
            return True  # Allow requests without origin (direct API calls)
        
        is_allowed = origin in allowed_origins or "*" in allowed_origins
        
        if not is_allowed:
            security_logger.warning(
                "Request from unauthorized origin",
                extra={"origin": origin}
            )
        
        return is_allowed


# Rate limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/hour"]
)


def get_rate_limit_key(request: Request) -> str:
    """
    Get rate limiting key based on user or IP
    
    Args:
        request: FastAPI request
        
    Returns:
        str: Rate limit key
    """
    # Try to get user email from request (if authenticated)
    user_email = getattr(request.state, 'user_email', None)
    
    if user_email:
        return f"user:{user_email}"
    
    # Fallback to IP address
    return f"ip:{get_remote_address(request)}"


def check_rate_limit(request: Request, limit: str = "10/minute") -> bool:
    """
    Check if request is within rate limits
    
    Args:
        request: FastAPI request
        limit: Rate limit string (e.g., "10/minute")
        
    Returns:
        bool: True if within limits
        
    Raises:
        HTTPException: If rate limit exceeded
    """
    # This is a placeholder - actual implementation uses slowapi middleware
    # See main.py for rate limit application
    return True


class InputSanitizer:
    """Sanitize inputs for safe storage and display"""
    
    @staticmethod
    def sanitize_for_storage(text: str) -> str:
        """
        Sanitize text for database storage
        
        Args:
            text: Input text
            
        Returns:
            str: Sanitized text
        """
        # Remove null bytes
        text = text.replace('\x00', '')
        
        # Normalize whitespace
        text = ' '.join(text.split())
        
        # Trim to reasonable length
        max_length = 10000
        if len(text) > max_length:
            text = text[:max_length]
            logger.warning(f"Text truncated to {max_length} characters")
        
        return text
    
    @staticmethod
    def sanitize_for_display(text: str) -> str:
        """
        Sanitize text for frontend display (prevent XSS)
        
        Args:
            text: Input text
            
        Returns:
            str: Sanitized text safe for display
        """
        # Allow some basic formatting but no scripts
        allowed_tags = ['b', 'i', 'u', 'br', 'p', 'strong', 'em']
        allowed_attributes = {}
        
        cleaned = bleach.clean(
            text,
            tags=allowed_tags,
            attributes=allowed_attributes,
            strip=True
        )
        
        return cleaned


def validate_chat_request(message: str, email: Optional[str] = None) -> tuple[bool, Optional[str]]:
    """
    Validate a complete chat request
    
    Args:
        message: User message
        email: Optional user email
        
    Returns:
        tuple: (is_valid, error_message)
    """
    validator = InputValidator()
    security = SecurityValidator()
    
    # Check message length
    if not validator.validate_message_length(message):
        return False, "Message exceeds maximum length of 2000 characters"
    
    # Check for suspicious patterns
    if not security.check_suspicious_patterns(message):
        return False, "Message contains suspicious content"
    
    # Validate email if provided
    if email and not validator.validate_email_address(email):
        return False, "Invalid email address format"
    
    # Sanitize message
    sanitized = validator.sanitize_query(message)
    if not sanitized:
        return False, "Message contains invalid content"
    
    return True, None


# Export commonly used validators
__all__ = [
    'InputValidator',
    'SecurityValidator',
    'InputSanitizer',
    'limiter',
    'get_rate_limit_key',
    'check_rate_limit',
    'validate_chat_request'
]