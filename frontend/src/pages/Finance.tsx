import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModernChartOfAccounts from './finance/ModernChartOfAccounts';
import GeneralLedger from './finance/GeneralLedger';
import JournalEntry from './finance/JournalEntry';
import Invoices from './Invoices';
import CompanyAccountDefaults from './finance/CompanyAccountDefaults';
import PaymentModes from './PaymentModes';
import PaymentEntryList from './PaymentEntryList';

type FinanceTab = 'chart-of-accounts' | 'general-ledger' | 'journal-entry' | 'account-defaults' | 'invoices' | 'payment-modes' | 'payment-entry';

export default function Finance() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('chart-of-accounts');

  const tabs = [
    {
      id: 'chart-of-accounts' as FinanceTab,
      name: 'دليل الحسابات',
      icon: 'fa-folder-tree',
      description: 'إدارة وتنظيم الحسابات المحاسبية'
    },
    {
      id: 'general-ledger' as FinanceTab,
      name: 'دفتر الأستاذ العام',
      icon: 'fa-book',
      description: 'عرض وإدارة دفتر الأستاذ العام'
    },
    {
      id: 'journal-entry' as FinanceTab,
      name: 'قيود اليومية',
      icon: 'fa-pen-to-square',
      description: 'إدخال وإدارة القيود المحاسبية'
    },
    {
      id: 'account-defaults' as FinanceTab,
      name: 'الحسابات الافتراضية',
      icon: 'fa-cog',
      description: 'تعيين الحسابات الافتراضية للمعاملات المتكررة'
    },
    {
      id: 'invoices' as FinanceTab,
      name: 'إدارة الفواتير',
      icon: 'fa-file-invoice',
      description: 'فواتير تسجيل الطلاب والمبالغ المالية'
    },
    {
      id: 'payment-modes' as FinanceTab,
      name: 'طرق الدفع',
      icon: 'fa-wallet',
      description: 'إدارة طرق الدفع المتاحة'
    },
    {
      id: 'payment-entry' as FinanceTab,
      name: 'قيود الدفع',
      icon: 'fa-money-bill-transfer',
      description: 'إنشاء قيود القبض والصرف'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chart-of-accounts':
        return <ModernChartOfAccounts />;
      case 'general-ledger':
        return <GeneralLedger />;
      case 'journal-entry':
        return <JournalEntry />;
      case 'account-defaults':
        return <CompanyAccountDefaults />;
      case 'invoices':
        return <Invoices />;
      case 'payment-modes':
        return <PaymentModes />;
      case 'payment-entry':
        return <PaymentEntryList />;
      default:
        return <ModernChartOfAccounts />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Main Header */}
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gray-600 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H4.5m-1.5 0v.375c0 .621.504 1.125 1.125 1.125h1.5m13.5-8.625c0-.621-.504-1.125-1.125-1.125H15.75m0 0h-.375C14.754 0 14.25.504 14.25 1.125v.375m0 0c0 .621.504 1.125 1.125 1.125h.375m-13.5 10.5c0 .621.504 1.125 1.125 1.125H4.5m0 0h.375c.621 0 1.125-.504 1.125-1.125V12m0 5.25v-5.25m0 0h10.5V12m0 0v.375c0 .621.504 1.125 1.125 1.125H18m0-1.125v-5.25m0 0h.375c.621 0 1.125-.504 1.125 1.125V8.25m0 0V7.875c0-.621-.504-1.125-1.125-1.125H17.25m0 0h-.375C16.254 6.75 15.75 7.254 15.75 7.875v.375m0 0v8.25m0-8.25h-6V12" />
                    </svg>
                  </div>
                  <div className="mr-4">
                    <h1 className="text-xl font-semibold text-gray-900">النظام المالي</h1>
                    <p className="text-sm text-gray-500">إدارة الحسابات والمعاملات المالية</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 space-x-reverse" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-gray-500 text-gray-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <i className={`fas ${tab.icon} ml-2 text-sm ${
                    activeTab === tab.id ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}></i>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative">
        {renderTabContent()}
      </div>
    </div>
  );
}
