from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import logging
import time
from typing import Dict, Any

logger = logging.getLogger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging request and response details."""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log request
        request_body = None
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                request_body = body.decode("utf-8")[:1000]  # Limit log size
            except:
                request_body = "Unable to read body"
        
        logger.info(
            f"Request: {request.method} {request.url.path} | "
            f"Client: {request.client.host if request.client else 'unknown'} | "
            f"Body: {request_body}"
        )
        
        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            logger.error(f"Request failed: {str(e)}", exc_info=True)
            raise
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Log response
        logger.info(
            f"Response: {request.method} {request.url.path} | "
            f"Status: {response.status_code} | "
            f"Time: {process_time:.3f}s"
        )
        
        # Add custom headers
        response.headers["X-Process-Time"] = str(process_time)
        
        return response