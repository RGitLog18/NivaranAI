import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Mail, Send, Users } from 'lucide-react';
import { toast } from 'sonner';
import { mockOfficers } from '../data/mockData';

export default function EmailPage() {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState('officer');

  const handleSendEmail = () => {
    if (!recipient || !subject || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    toast.success(`Email sent successfully to ${recipient}!`);
    // Reset form
    setRecipient('');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Send Email</h2>
          <p className="text-muted-foreground">
            Communicate with citizens and officers regarding complaints
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Compose Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recipient Type */}
              <div className="space-y-2">
                <Label htmlFor="recipientType">Recipient Type</Label>
                <Select value={recipientType} onValueChange={setRecipientType}>
                  <SelectTrigger id="recipientType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="officer">Desk Officer</SelectItem>
                    <SelectItem value="citizen">Citizen</SelectItem>
                    <SelectItem value="custom">Custom Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Recipient Selection */}
              <div className="space-y-2">
                <Label htmlFor="recipient">
                  {recipientType === 'officer' ? 'Select Officer' : 'Recipient Email'}
                </Label>
                {recipientType === 'officer' ? (
                  <Select value={recipient} onValueChange={setRecipient}>
                    <SelectTrigger id="recipient">
                      <SelectValue placeholder="Select an officer" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockOfficers.map((officer) => (
                        <SelectItem key={officer.id} value={officer.email}>
                          {officer.name} - {officer.designation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="recipient"
                    type="email"
                    placeholder="Enter email address"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                )}
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  rows={10}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Send Button */}
              <Button onClick={handleSendEmail} className="w-full" size="lg">
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => {
                    setSubject('Complaint Update');
                    setMessage('Dear recipient,\n\nThis is to inform you about an update on your complaint...\n\nBest regards,\nGovernment Office');
                  }}
                >
                  <div>
                    <p className="font-semibold text-sm">Complaint Update</p>
                    <p className="text-xs text-muted-foreground">Notify about status</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => {
                    setSubject('Task Assignment');
                    setMessage('Dear Officer,\n\nYou have been assigned a new complaint to handle...\n\nPlease review and take necessary action.\n\nBest regards');
                  }}
                >
                  <div>
                    <p className="font-semibold text-sm">Task Assignment</p>
                    <p className="text-xs text-muted-foreground">Assign complaint</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => {
                    setSubject('Complaint Resolution');
                    setMessage('Dear Citizen,\n\nWe are pleased to inform you that your complaint has been resolved...\n\nThank you for your patience.\n\nBest regards');
                  }}
                >
                  <div>
                    <p className="font-semibold text-sm">Resolution Notice</p>
                    <p className="text-xs text-muted-foreground">Inform resolution</p>
                  </div>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <Users className="h-10 w-10 mb-3 opacity-75" />
                <h4 className="font-semibold mb-2">Email Tips</h4>
                <ul className="text-sm space-y-1 opacity-90">
                  <li>• Be clear and concise</li>
                  <li>• Use professional language</li>
                  <li>• Include relevant details</li>
                  <li>• Follow up when needed</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
