import sys

path = 'client/src/pages/home.tsx'
with open(path, 'r') as f:
    content = f.read()

# The pattern we want to remove is the DialogTrigger containing the X button next to the title
target = """                                        <DialogTrigger asChild>
                                          <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full opacity-60 hover:opacity-100">
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </DialogTrigger>"""

# We only want to remove the one that is inside the "Verify Your Identity" header
# The header looks like:
# <div className="flex justify-between items-center">
#   <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verify Your Identity</h2>
#   ... target ...
# </div>

# Using a more specific replacement to ensure we only hit the one next to the title
specific_target = """                                      <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verify Your Identity</h2>
                                        <DialogTrigger asChild>
                                          <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full opacity-60 hover:opacity-100">
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </DialogTrigger>
                                      </div>"""

replacement = """                                      <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verify Your Identity</h2>
                                      </div>"""

if specific_target in content:
    new_content = content.replace(specific_target, replacement)
    with open(path, 'w') as f:
        f.write(new_content)
    print("Duplicate X icon removed successfully")
else:
    print("Specific target not found, trying fuzzy match...")
    import re
    # Fallback to regex if exact string match fails due to whitespace
    pattern = r'<div className="flex justify-between items-center">\s*<h2 className="text-xl font-bold text-slate-900 dark:text-white">Verify Your Identity</h2>\s*<DialogTrigger asChild>\s*<Button size="icon" variant="ghost" className="h-6 w-6 rounded-full opacity-60 hover:opacity-100">\s*<X className="h-4 w-4" />\s*</Button>\s*</DialogTrigger>\s*</div>'
    
    new_replacement = """<div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verify Your Identity</h2>
                                      </div>"""
    
    new_content = re.sub(pattern, new_replacement, content)
    if new_content != content:
        with open(path, 'w') as f:
            f.write(new_content)
        print("Duplicate X icon removed successfully via regex")
    else:
        print("Pattern not found")

