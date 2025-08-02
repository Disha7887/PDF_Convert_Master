import React from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { useLocation } from "wouter";
import { Bell, Search, FileText, Activity, ArrowDown, Check, Home, BarChart3, Settings, Book, GitBranch, Wrench, Upload, Clock, ArrowUp, ArrowRight, ChevronDown, Eye, ArrowLeft, Code2, Archive, FileImage } from "lucide-react";

export const ManagePlans: React.FC = () => {
  const [location, setLocation] = useLocation();

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    
      <div className="min-h-screen bg-gray-50">
        {/* Page Title Section */}
        <div className="bg-white border-b border-gray-200 px-6 py-8">
          <div className="max-w-7xl mx-auto px-20">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Manage Plans</h1>
              <p className="text-lg text-gray-600">Manage your subscription and billing</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-20 py-8">
          {/* Current Plan */}
          <Card className="mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <h2 className="text-xl font-bold text-gray-900 mr-3">Current Plan</h2>
                    <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">Pro Plan</h3>
                  <p className="text-gray-600">$29/monthly • Renews on 2/14/2024</p>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="outline" className="bg-gray-100">Cancel Subscription</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Usage Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* API Calls */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">API Calls</h3>
                  <Code2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-gray-900">8,654</span>
                    <span className="text-sm text-gray-600">of 50,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '17.3%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600">17.3% used</p>
                </div>
              </div>
            </Card>

            {/* Storage */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Storage</h3>
                  <Archive className="w-5 h-5 text-orange-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-gray-900">45.2 GB</span>
                    <span className="text-sm text-gray-600">of 100 GB</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{ width: '45.2%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600">45.2% used</p>
                </div>
              </div>
            </Card>

            {/* Conversions */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Conversions</h3>
                  <FileImage className="w-5 h-5 text-green-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-gray-900">2,847</span>
                    <span className="text-sm text-gray-600">of 10,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '28.5%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600">28.5% used</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Available Plans */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
            </CardHeader>
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Plan */}
                <div className="border rounded-lg p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Basic</h3>
                    <div className="flex items-end justify-center mb-4">
                      <span className="text-4xl font-bold text-gray-900">$9</span>
                      <span className="text-gray-600 ml-1">/month</span>
                    </div>
                    <p className="text-sm text-gray-600">or $90/year (save 17%)</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">1,000 API calls/month</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">10 GB storage</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">100 conversions/month</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">Basic support</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">Standard processing speed</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full">Downgrade</Button>
                </div>

                {/* Pro Plan - Current */}
                <div className="border-2 border-red-200 bg-red-50 rounded-lg p-6 relative">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
                    <div className="flex items-end justify-center mb-4">
                      <span className="text-4xl font-bold text-gray-900">$29</span>
                      <span className="text-gray-600 ml-1">/month</span>
                    </div>
                    <p className="text-sm text-gray-600">or $290/year (save 17%)</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">50,000 API calls/month</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">100 GB storage</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">10,000 conversions/month</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">Priority support</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">Fast processing speed</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">Advanced tools</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full">Downgrade</Button>
                </div>

                {/* Enterprise Plan */}
                <div className="border rounded-lg p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
                    <div className="flex items-end justify-center mb-4">
                      <span className="text-4xl font-bold text-gray-900">$99</span>
                      <span className="text-gray-600 ml-1">/month</span>
                    </div>
                    <p className="text-sm text-gray-600">or $990/year (save 17%)</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">Unlimited API calls</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">1 TB storage</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">Unlimited conversions</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">24/7 dedicated support</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">Ultra-fast processing</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">Custom integrations</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">SLA guarantee</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full">Upgrade</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Billing History</CardTitle>
                <Button variant="outline">Download All Invoices</Button>
              </div>
            </CardHeader>
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-1 text-sm font-semibold text-gray-900">Date</th>
                      <th className="text-left py-3 px-1 text-sm font-semibold text-gray-900">Amount</th>
                      <th className="text-left py-3 px-1 text-sm font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-1 text-sm font-semibold text-gray-900">Invoice</th>
                      <th className="text-right py-3 px-1 text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-4 px-1 text-sm text-gray-900">1/14/2024</td>
                      <td className="py-4 px-1 text-sm text-gray-900">$29.00</td>
                      <td className="py-4 px-1">
                        <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
                      </td>
                      <td className="py-4 px-1 text-sm font-mono text-gray-600">INV-2024-001</td>
                      <td className="py-4 px-1 text-right">
                        <Button variant="outline" size="sm">Download</Button>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-4 px-1 text-sm text-gray-900">12/14/2023</td>
                      <td className="py-4 px-1 text-sm text-gray-900">$29.00</td>
                      <td className="py-4 px-1">
                        <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
                      </td>
                      <td className="py-4 px-1 text-sm font-mono text-gray-600">INV-2023-012</td>
                      <td className="py-4 px-1 text-right">
                        <Button variant="outline" size="sm">Download</Button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-1 text-sm text-gray-900">11/14/2023</td>
                      <td className="py-4 px-1 text-sm text-gray-900">$29.00</td>
                      <td className="py-4 px-1">
                        <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
                      </td>
                      <td className="py-4 px-1 text-sm font-mono text-gray-600">INV-2023-011</td>
                      <td className="py-4 px-1 text-right">
                        <Button variant="outline" size="sm">Download</Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </main>
      </div>
    
  );
};
