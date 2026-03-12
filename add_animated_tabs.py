import sys
import re

path = 'client/src/pages/home.tsx'
with open(path, 'r') as f:
    content = f.read()

# Pattern for the title/header section to insert the tabs below it
pattern = r'(<h2 className="text-xl font-bold text-slate-900 dark:text-white">Verify Your Identity</h2>\s*</div>)'

# Animated tabs implementation
tabs_html = """
                                      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg w-fit mt-4">
                                        <button className="px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white transition-all">
                                          Tab 1
                                        </button>
                                        <button className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                                          Tab 2
                                        </button>
                                        <button className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                                          Tab 3
                                        </button>
                                      </div>"""

# Insertion point: after the header div ends
replacement = r'\1' + tabs_html

new_content = re.sub(pattern, replacement, content)

if new_content != content:
    with open(path, 'w') as f:
        f.write(new_content)
    print("Animated tabs added successfully")
else:
    print("Pattern not found for tab insertion")
