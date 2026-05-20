# -*- coding: utf-8 -*-
import codecs

checksum = "KwmcQoaXzjz217yMCVmckaPZn3s-qaNHVIbr-Ke8JBc"

def update_checksum(filename):
    with codecs.open(filename, 'r', 'utf-8') as f:
        content = f.read()
    
    content = content.replace("DUMMY_CHECKSUM_UPDATE_LATER", checksum)
    
    with codecs.open(filename, 'w', 'utf-8') as f:
        f.write(content)

update_checksum('retailer_portal.html')
update_checksum('store_portal.html')
