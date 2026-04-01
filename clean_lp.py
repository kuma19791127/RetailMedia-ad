import sys

with open("advertiser_lp.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

# 293 is index for line 294. 496 is index for line 497.
# We want to delete from exact line 294 to 496.
# Let's print the specific lines to verify.
print("Deleting lines start:", lines[293].strip())
print("Deleting lines end:", lines[495].strip())

new_lines = lines[:293] + lines[496:]

with open("advertiser_lp.html", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Done.")
