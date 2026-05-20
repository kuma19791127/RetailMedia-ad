# -*- coding: utf-8 -*-
import codecs

old_checksum = "KwmcQoaXzjz217yMCVmckaPZn3s-qaNHVIbr-Ke8JBc"
new_checksum = "Q2BraJOWHeEztZTZjjmwHvUDFsLGGDYVeQ-l7945ehQ"

def update_checksum(filename):
    with codecs.open(filename, 'r', 'utf-8') as f:
        content = f.read()
    
    content = content.replace(old_checksum, new_checksum)
    
    with codecs.open(filename, 'w', 'utf-8') as f:
        f.write(content)

update_checksum('retailer_portal.html')
update_checksum('store_portal.html')
