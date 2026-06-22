const fs = require('fs');

const filesToUpdate = [
    "d:\\AFS\\frontend\\src\\components\\LoanAssignment.jsx",
    "d:\\AFS\\frontend\\src\\components\\FMCTickets.jsx",
    "d:\\AFS\\frontend\\src\\components\\FMCDailyHours.jsx",
    "d:\\AFS\\frontend\\src\\components\\FMCContracts.jsx",
    "d:\\AFS\\frontend\\src\\components\\FMCBilling.jsx",
    "d:\\AFS\\frontend\\src\\components\\FinancingPipeline.jsx",
    "d:\\AFS\\frontend\\src\\components\\DetailsView.jsx",
    "d:\\AFS\\frontend\\src\\components\\Dashboard.jsx",
    "d:\\AFS\\frontend\\src\\components\\CustomerAnalytics.jsx"
];

const injection = `
  React.useEffect(() => {
    if (state?.data?.machines?.length === 0 && state.ensureMachinesLight) {
      state.ensureMachinesLight();
    }
  }, [state?.data?.machines?.length]);
`;

filesToUpdate.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf-8');
    
    if (content.includes('ensureMachinesLight')) return;
    
    let lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('= state.data') && lines[i].includes('machines')) {
            lines.splice(i + 1, 0, injection);
            break;
        }
    }
    
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
});

console.log("Done updating components.");
