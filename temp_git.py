import os
import subprocess

directory = 'c:/Users/one/Desktop/RetailMedia_System/base_loop_videos'
for f in os.listdir(directory):
    if f.endswith('.mp4') or f.endswith('.mov'):
        fp = os.path.join(directory, f)
        subprocess.run(['git', 'add', '-f', fp])
