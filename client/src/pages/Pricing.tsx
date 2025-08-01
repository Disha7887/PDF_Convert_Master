import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, FileText, Code, HardDrive, RefreshCw, Check } from "lucide-react";
import { useLocation } from "wouter";

export const Pricing = (): JSX.Element => {
  const [, setLocation] = useLocation();

  const usageStats = [
    {
      title: "API Calls",
      current: "8,654",
      total: "50,000",
      percentage: 17.3,
      icon: Code,
      color: "bg-blue-500"
    },
    {
      title: "Storage", 
      current: "45.2 GB",
      total: "100 GB", 
      percentage: 45.2,
      icon: HardDrive,
      color: "bg-orange-500"
    },
    {
      title: "Conversions",
      current: "2,847",
      total: "10,000",
      percentage: 28.5,
      icon: RefreshCw,
      color: "bg-green-500"
    }
  ];

  const plans = [
    {
      name: "Basic",
      price: "$9",
      period: "/month",
      yearlyNote: "or $90/year (save 17%)",
      features: [
        "1,000 API calls/month",
        "10 GB storage", 
        "100 conversions/month",
        "Basic support",
        "Standard processing speed"
      ],
      buttonText: "Downgrade",
      buttonVariant: "outline" as const,
      highlighted: false
    },
    {
      name: "Pro",
      price: "$29", 
      period: "/month",
      yearlyNote: "or $290/year (save 17%)",
      features: [
        "50,000 API calls/month",
        "100 GB storage",
        "10,000 conversions/month", 
        "Priority support",
        "Fast processing speed",
        "Advanced tools"
      ],
      buttonText: "Downgrade",
      buttonVariant: "outline" as const,
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month", 
      yearlyNote: "or $990/year (save 17%)",
      features: [
        "Unlimited API calls",
        "1 TB storage",
        "Unlimited conversions",
        "24/7 dedicated support",
        "Ultra-fast processing",
        "Custom integrations",
        "SLA guarantee"
      ],
      buttonText: "Upgrade",
      buttonVariant: "outline" as const,
      highlighted: false
    }
  ];

  const billingHistory = [
    {
      date: "1/14/2024",
      amount: "$29.00",
      status: "Paid",
      invoice: "INV-2024-001"
    },
    {
      date: "12/14/2023", 
      amount: "$29.00",
      status: "Paid",
      invoice: "INV-2023-012"
    },
    {
      date: "11/14/2023",
      amount: "$29.00", 
      status: "Paid",
      invoice: "INV-2023-011"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="mr-4"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Plans</h1>
              <p className="text-sm text-gray-600">Manage your subscription and billing</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">PDFConverter Pro</h2>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Current Plan */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center mb-2">
                  <h2 className="text-xl font-bold text-gray-900 mr-3">Current Plan</h2>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">Pro Plan</h3>
                <p className="text-gray-600">$29/monthly • Renews on 2/14/2024</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline">Change Plan</Button>
                <Button variant="outline" className="bg-gray-50">Cancel Subscription</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          {usageStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">{stat.title}</h3>
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-bold text-gray-900">{stat.current}</span>
                      <span className="text-sm text-gray-600">of {stat.total}</span>
                    </div>
                    <Progress value={stat.percentage} className="h-2" />
                    <p className="text-sm text-gray-600">{stat.percentage}% used</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Available Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Available Plans</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`border rounded-xl p-6 ${
                    plan.highlighted 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                    <div className="flex items-end justify-center mb-2">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 ml-1">{plan.period}</span>
                    </div>
                    <p className="text-sm text-gray-600">{plan.yearlyNote}</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    variant={plan.buttonVariant}
                    className="w-full"
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold text-gray-900">Billing History</CardTitle>
              <Button variant="outline">Download All Invoices</Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-1 font-semibold text-gray-900">Date</th>
                    <th className="text-left py-3 px-1 font-semibold text-gray-900">Amount</th>
                    <th className="text-left py-3 px-1 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-1 font-semibold text-gray-900">Invoice</th>
                    <th className="text-right py-3 px-1 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-4 px-1 text-gray-900">{item.date}</td>
                      <td className="py-4 px-1 text-gray-900">{item.amount}</td>
                      <td className="py-4 px-1">
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-1 text-gray-600 font-mono text-sm">{item.invoice}</td>
                      <td className="py-4 px-1 text-right">
                        <Button variant="outline" size="sm">
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
