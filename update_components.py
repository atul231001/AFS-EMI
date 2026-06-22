import os

files_to_update = [
    r"d:\AFS\frontend\src\components\LoanAssignment.jsx",
    r"d:\AFS\frontend\src\components\FMCTickets.jsx",
    r"d:\AFS\frontend\src\components\FMCDailyHours.jsx",
    r"d:\AFS\frontend\src\components\FMCContracts.jsx",
    r"d:\AFS\frontend\src\components\FMCBilling.jsx",
    r"d:\AFS\frontend\src\components\FinancingPipeline.jsx",
    r"d:\AFS\frontend\src\components\DetailsView.jsx",
    r"d:\AFS\frontend\src\components\Dashboard.jsx",
    r"d:\AFS\frontend\src\components\CustomerAnalytics.jsx"
]

injection = """
  React.useEffect(() => {
    if (state.data.machines && state.data.machines.length === 0) {
      state.ensureMachinesLight();
    }
  }, []);
"""

for file_path in files_to_update:
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Check if we already injected it
    if "ensureMachinesLight" in content:
        continue
        
    # We will inject it right after the line `const { ... machines ... } = state.data;`
    # Wait, some lines might not have exact matches.
    # Let's inject it right after the component declaration:
    # `const ComponentName = ({ state }) => {`
    
    # Or find the first `const {` that includes `machines` or just find `state.data`
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if "= state.data" in line and "machines" in line:
            lines.insert(i + 1, injection)
            break
            
    with open(file_path, "w", encoding="utf-8") as f:
        f.write('\n'.join(lines))
        
print("Done updating components.")
