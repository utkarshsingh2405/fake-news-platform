from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text_input = Column(Text, nullable=False)
    prediction_result = Column(Boolean, nullable=False)  # True = Fake, False = Real
    confidence_score = Column(Float, nullable=False)
    important_keywords = Column(Text, nullable=True)  # JSON string of keywords
    explanation = Column(Text, nullable=True)  # Reason for the prediction
    model_version = Column(String(50), nullable=True)
    processing_time_ms = Column(Float, nullable=True)
    source_type = Column(String(20), default="text")  # text, file, url
    file_name = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="predictions")
    
    def __repr__(self):
        return f"<Prediction(id={self.id}, user_id={self.user_id}, result={self.prediction_result})>"