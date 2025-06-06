from bs4 import BeautifulSoup
import requests
import json

def scrape_recursive_links_to_json(html_content):
    
    soup = BeautifulSoup(html_content, 'html.parser')

    def get_heading_layer(tag_name):
        heading_layers = {'h3': 1, 'h4': 2, 'h5': 3, 'h6': 4}
        return heading_layers.get(tag_name, 0)
    
    def process_element(element, current_level):
        if not element:
            return []

        items_at_this_level = []
        for li_item in element.find_all('li', recursive=False):
            target_a = None
            item_data = None

            b_tag = None
            i_tag_child = li_item.find('i', recursive=False)
            if i_tag_child:
                b_tag_in_i = i_tag_child.find('b', recursive=False)
                if b_tag_in_i:
                    b_tag = b_tag_in_i

            if not b_tag:
                b_tag_direct = li_item.find('b', recursive=False)
                if b_tag_direct:
                    b_tag = b_tag_direct

            if b_tag:
                a_tag = b_tag.find('a', href=True, title=True)
                if not a_tag:
                    a_tag = b_tag.find('a', href=True)
                if a_tag:
                    target_a = b_tag.find('a', href=True, title=True)

            if not target_a:
                potential_a_tags = []
                for child in li_item.children:
                    if child.name == 'a' and \
                       child.has_attr('href') and \
                       child.has_attr('title') and \
                       "Wikipedia:Vital_articles" not in child.get('href', ''):
                        potential_a_tags.append(child)
                        target_a = potential_a_tags[0]

            if target_a:
                item_data = {
                    "name": target_a.get_text(strip=True),
                    "link": base_url + target_a['href'],
                    "layer": current_level,
                    "children": []
                }

                nested_ol = li_item.find('ol', recursive=False)
                if nested_ol:
                    children_items = process_element(nested_ol, current_level + 1)
                    if children_items:
                        item_data["children"] = children_items
                
                items_at_this_level.append(item_data)
        
        return items_at_this_level

    def process_content_with_headings():
        all_items = []
        heading_stack = []
        
        content_elements = soup.find_all(['h3', 'h4', 'h5', 'h6', 'ol'])
        
        current_heading_layer = 0
        i = 0
        
        while i < len(content_elements):
            element = content_elements[i]
            
            if element.name in ['h3', 'h4', 'h5', 'h6']:
                current_heading_layer = get_heading_layer(element.name)
                
                heading_data = {
                    "name": element.get_text(strip=True),
                    "link": None,
                    "layer": current_heading_layer,
                    "type": "heading",
                    "heading_id": element.get('data-mw-thread-id') or element.get('id'),
                    "children": []
                }
                while heading_stack and heading_stack[-1]['layer'] >= current_heading_layer:
                    heading_stack.pop()
                
                if heading_stack:
                    heading_stack[-1]['children'].append(heading_data)
                else:
                    all_items.append(heading_data)
                
                heading_stack.append(heading_data)
                
            elif element.name == 'ol':
                parent = element.parent
                if parent and parent.name not in ['li']:
                    ol_items = process_element(element, current_heading_layer + 1)
                    if ol_items:
                        if heading_stack:
                            heading_stack[-1]['children'].extend(ol_items)
                        else:
                            all_items.extend(ol_items)
            
            i += 1
        
        return all_items

    scraped_data_list = process_content_with_headings()
    
    return scraped_data_list


if __name__ == '__main__':
    base_url = "https://en.wikipedia.org"
    urls = {
        "people": "https://en.wikipedia.org/wiki/Wikipedia:Vital_articles/Level/4/People",
        "history": "https://en.wikipedia.org/wiki/Wikipedia:Vital_articles/Level/4/History",
        "geography": "https://en.wikipedia.org/wiki/Wikipedia:Vital_articles/Level/4/Geography",
        "philosophy_and_religion": "https://en.wikipedia.org/wiki/Wikipedia:Vital_articles/Level/4/Philosophy_and_religion",
        "everyday_life": "https://en.wikipedia.org/wiki/Wikipedia:Vital_articles/Level/4/Everyday_life",
        "society_and_social_sciences": "https://en.wikipedia.org/wiki/Wikipedia:Vital_articles/Level/4/Society_and_social_sciences",
        "mathematics": "https://en.wikipedia.org/wiki/Wikipedia:Vital_articles/Level/4/Mathematics"
    }

    for key, url in urls.items():
        print(f"Scraping: {key}")
        response = requests.get(url)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            scraped_data = scrape_recursive_links_to_json(response.text)
            output_filename = f"scraped_data_{key}.json"
            try:
                with open(output_filename, 'w', encoding='utf-8') as f:
                    json.dump(scraped_data, f, indent=2, ensure_ascii=False)
                print(f"Saved to {output_filename}")
            except Exception as e:
                print(f"Error saving {output_filename}: {e}")
        else:
            print(f"Failed to fetch {url}, status code: {response.status_code}")