import sys

path = 'client/src/pages/home.tsx'
with open(path, 'r') as f:
    content = f.read()

# Try a more robust matching that ignores minor whitespace differences if necessary
import re

pattern = r'<div className="w-full md:w-1/2 p-8 flex flex-col justify-between relative">\s*<div className="space-y-6">\s*</div>\s*</div>'

replacement = """<div className="w-full md:w-1/2 p-8 flex flex-col justify-between relative">
                                    <div className="space-y-6">
                                      <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verify Your Identity</h2>
                                        <DialogTrigger asChild>
                                          <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full opacity-60 hover:opacity-100">
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </DialogTrigger>
                                      </div>
                                      
                                      <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Enter your secure PIN to complete verification.
                                      </p>

                                      <div className="space-y-4 pt-4">
                                        <div className="relative group">
                                          <Input 
                                            placeholder="Enter verification PIN" 
                                            className="h-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl px-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-500/50 transition-all"
                                            type="password"
                                            data-testid="input-verification-pin"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-6">
                                      <DialogTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          className="flex-1 h-11 rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                          data-testid="button-cancel-verify"
                                        >
                                          Cancel
                                        </Button>
                                      </DialogTrigger>
                                      <Button 
                                        className="flex-1 h-11 rounded-xl bg-slate-500 hover:bg-slate-600 text-white shadow-lg shadow-slate-500/20"
                                        data-testid="button-verify-identity"
                                      >
                                        Verify Identity
                                      </Button>
                                    </div>
                                  </div>"""

new_content = re.sub(pattern, replacement, content)

if new_content != content:
    with open(path, 'w') as f:
        f.write(new_content)
    print("Replacement successful")
else:
    print("Pattern not found")
