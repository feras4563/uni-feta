import { TreeView } from "@/components/ui/tree-view";
import { Building2, Wallet, Users, BookOpen, Calculator, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const TreeViewDemo = () => {
  const treeData = [
    {
      id: "1",
      label: "Documents",
      children: [
        {
          id: "1-1",
          label: "Projects",
          children: [
            { id: "1-1-1", label: "Project A.pdf" },
            { id: "1-1-2", label: "Project B.docx" },
            {
              id: "1-1-3",
              label: "Archive",
              children: [
                { id: "1-1-3-1", label: "Old Project.zip" },
                { id: "1-1-3-2", label: "Backup.tar" },
              ],
            },
          ],
        },
        {
          id: "1-2",
          label: "Reports",
          children: [
            { id: "1-2-1", label: "Monthly Report.xlsx" },
            { id: "1-2-2", label: "Annual Report.pdf" },
          ],
        },
      ],
    },
    {
      id: "2",
      label: "Downloads",
      children: [
        { id: "2-1", label: "setup.exe" },
        { id: "2-2", label: "image.jpg" },
        { id: "2-3", label: "video.mp4" },
      ],
    },
    {
      id: "3",
      label: "Desktop",
      children: [{ id: "3-1", label: "shortcut.lnk" }],
    },
  ];

  const chartOfAccountsData = [
    {
      id: "assets",
      label: "الأصول (Assets)",
      icon: <Building2 className="h-4 w-4" />,
      children: [
        {
          id: "current-assets",
          label: "الأصول المتداولة (Current Assets)",
          icon: <Wallet className="h-4 w-4" />,
          children: [
            {
              id: "cash",
              label: "النقدية (Cash)",
              icon: <DollarSign className="h-4 w-4" />,
              children: [
                { id: "cash-on-hand", label: "النقدية في الصندوق", icon: <DollarSign className="h-4 w-4" /> },
                { id: "bank-accounts", label: "الحسابات البنكية", icon: <Wallet className="h-4 w-4" /> }
              ]
            },
            {
              id: "receivables",
              label: "الذمم المدينة (Accounts Receivable)",
              icon: <TrendingUp className="h-4 w-4" />,
              children: [
                { id: "student-fees", label: "رسوم الطلاب", icon: <Users className="h-4 w-4" /> },
                { id: "other-receivables", label: "ذمم أخرى", icon: <BookOpen className="h-4 w-4" /> }
              ]
            }
          ]
        },
        {
          id: "fixed-assets",
          label: "الأصول الثابتة (Fixed Assets)",
          icon: <Building2 className="h-4 w-4" />,
          children: [
            { id: "buildings", label: "المباني", icon: <Building2 className="h-4 w-4" /> },
            { id: "equipment", label: "المعدات", icon: <Calculator className="h-4 w-4" /> },
            { id: "furniture", label: "الأثاث", icon: <BookOpen className="h-4 w-4" /> }
          ]
        }
      ]
    },
    {
      id: "liabilities",
      label: "الخصوم (Liabilities)",
      icon: <TrendingDown className="h-4 w-4" />,
      children: [
        {
          id: "current-liabilities",
          label: "الخصوم المتداولة (Current Liabilities)",
          icon: <Wallet className="h-4 w-4" />,
          children: [
            { id: "accounts-payable", label: "الذمم الدائنة", icon: <TrendingDown className="h-4 w-4" /> },
            { id: "accrued-expenses", label: "المصروفات المستحقة", icon: <Calculator className="h-4 w-4" /> },
            { id: "short-term-loans", label: "القروض قصيرة الأجل", icon: <DollarSign className="h-4 w-4" /> }
          ]
        }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Tree View Demo</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">File System Example</h3>
            <TreeView
              data={treeData}
              onNodeClick={(node) => console.log("Clicked:", node.label)}
              defaultExpandedIds={["1"]}
            />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Chart of Accounts Example</h3>
            <TreeView
              data={chartOfAccountsData}
              onNodeClick={(node) => console.log("Account clicked:", node.label)}
              defaultExpandedIds={["assets", "liabilities"]}
              showLines={true}
              showIcons={true}
              selectable={true}
              animateExpand={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export { TreeViewDemo };



