import requests
import json
import tempfile
import os

def fetch_and_parse_data(url):
    try:
        # Make the HTTP request
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.json') as temp_file:
            # Write the JSON response to the temp file
            json.dump(response.json(), temp_file)
            temp_file_path = temp_file.name
            
        print(f"Data saved to temporary file: {temp_file_path}")
        
        # Read and parse the data
        with open(temp_file_path, 'r') as f:
            data = json.load(f)
            
        # Extract the specific data path
        if 'pageProps' in data:
            star_offers = data['data']
            
            # Extract only the required fields
            processed_offers = []
            for offer in star_offers:
                processed_offer = {
                    'nid': offer['nid'],
                    'title': offer['title'],
                    'teaser': offer['teaser'],
                    'path': offer['path'],
                    'thumb_image': offer['thumb_image'],
                    'description': offer['metatag'].get('description', '')
                }
                processed_offers.append(processed_offer)
            
            # Save to offers_new.json in the main directory
            output_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'offers_new.json')
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(processed_offers, f, indent=2, ensure_ascii=False)
            
            print(f"\nProcessed data saved to: {output_path}")
        else:
            print("Could not find the specified data path in the response")
            
        # Clean up the temporary file
        os.unlink(temp_file_path)
        
    except requests.exceptions.RequestException as e:
        print(f"Error making the request: {e}")
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
    except KeyError as e:
        print(f"Error accessing data path: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# Replace this URL with your actual endpoint
url = "https://bkwebsitethc.grameenphone.com/api/star-offers-list?star_status=all&star_offer_categories=all&offer_areas=all&search_offer=&page_number=1"
fetch_and_parse_data(url)