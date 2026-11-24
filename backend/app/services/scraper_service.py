import requests
from bs4 import BeautifulSoup
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class ScraperService:
    """Service to scrape article content from URLs."""
    
    @staticmethod
    def scrape_article(url: str) -> Optional[str]:
        """
        Extract main article text from a URL.
        Returns extracted text or None if failed.
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Try to find main content (common selectors)
            content_selectors = ['article', 'main', '.content', '.post-content', '.article-body']
            text = None
            for selector in content_selectors:
                element = soup.select_one(selector)
                if element:
                    text = element.get_text(separator='\n')
                    break
            
            if not text:
                # Fallback: get all text
                text = soup.get_text(separator='\n')
            
            # Clean text
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = '\n'.join(chunk for chunk in chunks if chunk)
            
            if len(text) < 100:
                logger.warning(f"Extracted text too short from {url}")
                return None
            
            return text
            
        except Exception as e:
            logger.error(f"Error scraping {url}: {str(e)}")
            return None
    
    @staticmethod
    def get_article_metadata(url: str) -> dict:
        """Extract metadata (title, description, etc.)."""
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            title = soup.find('title')
            title = title.get_text().strip() if title else None
            
            description = soup.find('meta', attrs={'name': 'description'})
            description = description.get('content', '').strip() if description else None
            
            return {
                "title": title,
                "description": description,
                "url": url
            }
        except Exception as e:
            logger.error(f"Error getting metadata: {str(e)}")
            return {"url": url}