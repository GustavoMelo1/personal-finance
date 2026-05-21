import json
import logging

logger = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

#function to display wishes
def wishes():
    try:
        with open('data/wishes.json', 'r', encoding='utf-8') as arquivo:
            dados = json.load(arquivo)

        logger.info("Searching wishes items...")
        
        return dados['wishes']

    except FileNotFoundError:
        logger.warning("Wishes don't exist yet. Please add some wishes first.")
        return []
    except Exception as e:
        logger.error(f"error in wishes: {e}")
        return []

def news():
    try:
        with open('data/financialmarketnews.json', 'r', encoding='utf-8') as arquivo:
            dados = json.load(arquivo)
            
        logger.info("Searching financial news...")
        
        # Devolve a lista de notícias
        return dados['news']
            
    except FileNotFoundError:
        logger.warning("News don't exist yet. Please add some news first.")
        return []
    except Exception as e:
        logger.error(f"error in news: {e}")
        return []

#executes the functions when the script runs
if __name__ == "__main__":
    wishes()
    news()