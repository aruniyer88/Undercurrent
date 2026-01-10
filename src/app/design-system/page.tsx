"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Settings, 
  User, 
  Bell, 
  Heart, 
  Star, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Edit, 
  MoreVertical,
  Check,
  X,
  AlertCircle,
  Info,
  CheckCircle2,
  Filter,
  Calendar,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

export default function DesignSystemShowcase() {
  const [sliderValue, setSliderValue] = useState([50]);
  const [isChecked, setIsChecked] = useState(false);
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      {/* Hero Section with Design System Header */}
      <div className="relative bg-gradient-to-b from-white to-[#F6F8FB] py-20 px-6 border-b border-[#E3EAF3]">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold text-[#0C1422] tracking-tight mb-4">
            Design System Showcase
          </h1>
          <p className="text-lg text-[#6C7C90] max-w-2xl mx-auto leading-relaxed">
            A comprehensive display of all UI components built with modern enterprise SaaS design principles.
            Calm, airy, and confident with soft depth and generous whitespace.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        
        {/* Buttons Section */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0C1422] mb-2">Buttons</h2>
            <p className="text-[#6C7C90]">Pill-shaped buttons with various sizes and states</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70">
              <CardHeader>
                <CardTitle className="text-xl">Primary Buttons</CardTitle>
                <CardDescription>High-emphasis actions with brand blue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="default">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    With Icon
                  </Button>
                  <Button disabled>Disabled</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70">
              <CardHeader>
                <CardTitle className="text-xl">Button Variants</CardTitle>
                <CardDescription>Different visual styles for various contexts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Form Inputs Section */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0C1422] mb-2">Form Controls</h2>
            <p className="text-[#6C7C90]">Input fields, textareas, and selection controls</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70">
              <CardHeader>
                <CardTitle className="text-xl">Text Inputs</CardTitle>
                <CardDescription>Pill-shaped inputs with clean styling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9FB0C3]" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="you@example.com"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9FB0C3]" />
                    <Input 
                      id="search" 
                      placeholder="Search anything..."
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9FB0C3]" />
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+1 (555) 000-0000"
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70">
              <CardHeader>
                <CardTitle className="text-xl">Textarea & Select</CardTitle>
                <CardDescription>Multi-line input and dropdown controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message"
                    placeholder="Type your message here..."
                    rows={4}
                  />
                  <p className="text-xs text-[#9FB0C3]">Your message will be sent to the team.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Select Role</Label>
                  <Select>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Choose a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Checkboxes and Sliders */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0C1422] mb-2">Selection Controls</h2>
            <p className="text-[#6C7C90]">Checkboxes, radio buttons, and range sliders</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70">
              <CardHeader>
                <CardTitle className="text-xl">Checkboxes</CardTitle>
                <CardDescription>Multi-select options with labels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox id="terms" checked={isChecked} onCheckedChange={(checked) => setIsChecked(checked as boolean)} />
                  <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                    Accept terms and conditions
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox id="marketing" />
                  <Label htmlFor="marketing" className="text-sm font-normal cursor-pointer">
                    Receive marketing emails
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox id="updates" defaultChecked />
                  <Label htmlFor="updates" className="text-sm font-normal cursor-pointer">
                    Get product updates
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox id="disabled" disabled />
                  <Label htmlFor="disabled" className="text-sm font-normal cursor-not-allowed text-[#9FB0C3]">
                    Disabled option
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70">
              <CardHeader>
                <CardTitle className="text-xl">Slider</CardTitle>
                <CardDescription>Range control for numeric values</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Volume</Label>
                    <span className="text-sm font-medium text-[#6C7C90]">{sliderValue[0]}%</span>
                  </div>
                  <Slider 
                    value={sliderValue} 
                    onValueChange={setSliderValue}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Brightness</Label>
                    <span className="text-sm font-medium text-[#6C7C90]">75%</span>
                  </div>
                  <Slider defaultValue={[75]} max={100} step={1} />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Disabled</Label>
                    <span className="text-sm font-medium text-[#9FB0C3]">30%</span>
                  </div>
                  <Slider defaultValue={[30]} max={100} step={1} disabled />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Badges and Chips */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0C1422] mb-2">Badges & Status Indicators</h2>
            <p className="text-[#6C7C90]">Pills and chips for tags and status</p>
          </div>

          <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70">
            <CardHeader>
              <CardTitle className="text-xl">Badge Variants</CardTitle>
              <CardDescription>Different semantic states and styles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block">Status Badges</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="mb-3 block">With Icons</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default" className="bg-success-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Success
                  </Badge>
                  <Badge variant="default" className="bg-warning-600">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Warning
                  </Badge>
                  <Badge variant="default" className="bg-info-600">
                    <Info className="w-3 h-3 mr-1" />
                    Info
                  </Badge>
                  <Badge variant="outline">
                    <Filter className="w-3 h-3 mr-1" />
                    Filter
                    <span className="ml-1.5 px-1.5 py-0.5 bg-primary-600 text-white text-xs rounded-full">3</span>
                  </Badge>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="mb-3 block">Interactive Tags</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="cursor-pointer hover:bg-neutral-200">
                    React
                  </Badge>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-neutral-200">
                    TypeScript
                  </Badge>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-neutral-200">
                    Tailwind
                  </Badge>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-neutral-200">
                    Next.js
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tabs */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0C1422] mb-2">Tabs</h2>
            <p className="text-[#6C7C90]">Navigation between related content sections</p>
          </div>

          <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70">
            <CardContent className="pt-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4 mt-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-6 bg-gradient-to-br from-primary-50 to-white rounded-2xl border border-primary-100">
                      <div className="text-sm text-[#6C7C90] mb-1">Total Users</div>
                      <div className="text-3xl font-bold text-[#0C1422]">2,845</div>
                      <div className="text-xs text-success-600 mt-2">↑ 12% from last month</div>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-success-50 to-white rounded-2xl border border-success-600/20">
                      <div className="text-sm text-[#6C7C90] mb-1">Active Sessions</div>
                      <div className="text-3xl font-bold text-[#0C1422]">1,234</div>
                      <div className="text-xs text-success-600 mt-2">↑ 8% from last week</div>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-warning-50 to-white rounded-2xl border border-warning-600/20">
                      <div className="text-sm text-[#6C7C90] mb-1">Pending Tasks</div>
                      <div className="text-3xl font-bold text-[#0C1422]">47</div>
                      <div className="text-xs text-warning-600 mt-2">↓ 3 from yesterday</div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="analytics" className="mt-6">
                  <div className="p-12 text-center bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
                    <p className="text-[#6C7C90]">Analytics content would go here</p>
                  </div>
                </TabsContent>
                <TabsContent value="reports" className="mt-6">
                  <div className="p-12 text-center bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
                    <p className="text-[#6C7C90]">Reports content would go here</p>
                  </div>
                </TabsContent>
                <TabsContent value="settings" className="mt-6">
                  <div className="p-12 text-center bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
                    <p className="text-[#6C7C90]">Settings content would go here</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Cards and Panels */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0C1422] mb-2">Cards & Panels</h2>
            <p className="text-[#6C7C90]">Elevated surfaces with soft shadows</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70 hover:shadow-[0_18px_50px_rgba(15,23,42,0.16)] transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary-600" />
                  </div>
                  <span>Featured</span>
                </CardTitle>
                <CardDescription>Special highlighted content</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#6C7C90] leading-relaxed">
                  This card demonstrates the floating style with enhanced elevation and a subtle hover effect.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70 hover:shadow-[0_18px_50px_rgba(15,23,42,0.16)] transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
                    <Check className="w-5 h-5 text-success-600" />
                  </div>
                  <span>Completed</span>
                </CardTitle>
                <CardDescription>Task successfully finished</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#6C7C90] leading-relaxed">
                  Cards maintain consistent padding and rounded corners with generous whitespace.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70 hover:shadow-[0_18px_50px_rgba(15,23,42,0.16)] transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-warning-600" />
                  </div>
                  <span>Pending</span>
                </CardTitle>
                <CardDescription>Awaiting your action</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#6C7C90] leading-relaxed">
                  Soft shadows create depth without harsh outlines or heavy borders.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Avatars and User Info */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0C1422] mb-2">Avatars & User Elements</h2>
            <p className="text-[#6C7C90]">Profile pictures and user representations</p>
          </div>

          <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70">
            <CardHeader>
              <CardTitle className="text-xl">Avatar Sizes</CardTitle>
              <CardDescription>Different sizes for various contexts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=1" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <Avatar className="w-12 h-12">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=2" />
                  <AvatarFallback>AB</AvatarFallback>
                </Avatar>
                <Avatar className="w-10 h-10">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=3" />
                  <AvatarFallback>CD</AvatarFallback>
                </Avatar>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">EF</AvatarFallback>
                </Avatar>
              </div>
              <Separator />
              <div className="space-y-3">
                <Label className="mb-2 block">User List</Label>
                {[
                  { name: "Sarah Johnson", email: "sarah@example.com", seed: "4" },
                  { name: "Michael Chen", email: "michael@example.com", seed: "5" },
                  { name: "Emma Williams", email: "emma@example.com", seed: "6" },
                ].map((user, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.seed}`} />
                      <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-[#0C1422]">{user.name}</div>
                      <div className="text-sm text-[#6C7C90]">{user.email}</div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Dropdowns and Menus */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0C1422] mb-2">Dropdowns & Menus</h2>
            <p className="text-[#6C7C90]">Contextual actions and navigation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70">
              <CardHeader>
                <CardTitle className="text-xl">Dropdown Menu</CardTitle>
                <CardDescription>Actions menu with icons</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        Actions
                        <MoreVertical className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-error-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Bell className="w-4 h-4 mr-2" />
                        Notifications
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70">
              <CardHeader>
                <CardTitle className="text-xl">Dialog Modal</CardTitle>
                <CardDescription>Overlay for focused interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Open Dialog</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Share this link</DialogTitle>
                      <DialogDescription>
                        Anyone who has this link will be able to view this document.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 mt-4">
                      <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                          Link
                        </Label>
                        <Input
                          id="link"
                          defaultValue="https://app.example.com/share/abc123"
                          readOnly
                        />
                      </div>
                      <Button size="sm" className="px-3">
                        Copy
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Accordion */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0C1422] mb-2">Accordion</h2>
            <p className="text-[#6C7C90]">Collapsible content sections</p>
          </div>

          <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70">
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>What is the design philosophy?</AccordionTrigger>
                  <AccordionContent>
                    Our design system embraces modern enterprise SaaS aesthetics with a calm, airy, and confident feel.
                    We prioritize whitespace as a primary design element and use soft elevation with subtle borders.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>How are colors used?</AccordionTrigger>
                  <AccordionContent>
                    We use a neutral-first approach with a single high-saturation blue for primary actions.
                    Secondary accent colors are used sparingly for semantic cues like success, warning, and error states.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>What about accessibility?</AccordionTrigger>
                  <AccordionContent>
                    All components meet WCAG AA standards with proper contrast ratios, visible focus states,
                    and minimum touch target sizes of 40-44px for interactive elements.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* Table */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0C1422] mb-2">Data Table</h2>
            <p className="text-[#6C7C90]">Structured data display with minimal dividers</p>
          </div>

          <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70">
            <CardContent className="pt-6">
              <div className="rounded-xl border border-[#E3EAF3] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-25">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#0C1422]">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#0C1422]">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#0C1422]">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#0C1422]">Email</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#0C1422]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      { name: "Alex Rivera", status: "active", role: "Admin", email: "alex@example.com" },
                      { name: "Jordan Lee", status: "active", role: "Editor", email: "jordan@example.com" },
                      { name: "Taylor Swift", status: "inactive", role: "Viewer", email: "taylor@example.com" },
                      { name: "Morgan Freeman", status: "active", role: "Editor", email: "morgan@example.com" },
                    ].map((row, i) => (
                      <tr key={i} className="border-t border-[#E3EAF3]/70 hover:bg-neutral-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} />
                              <AvatarFallback>{row.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-[#0C1422]">{row.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={row.status === "active" ? "default" : "secondary"} className={row.status === "active" ? "bg-success-600" : ""}>
                            {row.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-[#6C7C90]">{row.role}</td>
                        <td className="py-3 px-4 text-[#6C7C90]">{row.email}</td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Toast Notifications */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0C1422] mb-2">Toast Notifications</h2>
            <p className="text-[#6C7C90]">Temporary messages for user feedback</p>
          </div>

          <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70">
            <CardHeader>
              <CardTitle className="text-xl">Toast Examples</CardTitle>
              <CardDescription>Click buttons to trigger different toast types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    toast({
                      title: "Success!",
                      description: "Your changes have been saved successfully.",
                    });
                  }}
                  variant="outline"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2 text-white" />
                  Show Success
                </Button>
                <Button
                  onClick={() => {
                    toast({
                      title: "Warning",
                      description: "Please review your input before continuing.",
                      variant: "destructive",
                    });
                  }}
                  variant="outline"
                >
                  <AlertCircle className="w-4 h-4 mr-2 text-white" />
                  Show Warning
                </Button>
                <Button
                  onClick={() => {
                    toast({
                      title: "Information",
                      description: "This is an informational message for you.",
                    });
                  }}
                  variant="outline"
                >
                  <Info className="w-4 h-4 mr-2 text-white" />
                  Show Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Icons Grid */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0C1422] mb-2">Iconography</h2>
            <p className="text-[#6C7C90]">Simple geometric line icons from Lucide</p>
          </div>

          <Card className="shadow-[0_10px_30px_rgba(15,23,42,0.10)] border-[#E3EAF3]/70">
            <CardContent className="pt-6">
              <div className="grid grid-cols-6 md:grid-cols-10 gap-4">
                {[
                  Search, Settings, User, Bell, Heart, Star, Download, Upload, 
                  Plus, Trash2, Edit, MoreVertical, Check, X, AlertCircle, 
                  Info, CheckCircle2, Filter, Calendar, Mail
                ].map((Icon, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-center w-12 h-12 rounded-xl hover:bg-primary-50 hover:text-primary-600 text-[#6C7C90] transition-colors cursor-pointer"
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

      </div>

      {/* Footer */}
      <div className="border-t border-[#E3EAF3] bg-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[#6C7C90]">
            Design System Showcase • Built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui
          </p>
        </div>
      </div>
    </div>
  );
}

