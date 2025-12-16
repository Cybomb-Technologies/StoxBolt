import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import {
  Upload,
  Globe,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Save,
  Eye,
  ExternalLink,
  Calendar,
  Tag,
  History,
  Trash2,
  Info,
  Settings,
  Play,
  Pause,
  Edit,
  Plus
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';

const baseURL = import.meta.env.VITE_API_URL || 'https://api.stoxbolt.com';

// Simple button component
const Button = ({ children, onClick, disabled, className = '', variant = 'default', size = 'default', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variantClasses = {
    default: 'bg-gray-900 text-white hover:bg-gray-800',
    outline: 'border border-gray-300 bg-white hover:bg-gray-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'hover:bg-gray-100',
    orange: 'bg-orange-600 text-white hover:bg-orange-700'
  };

  const sizeClasses = {
    default: 'h-10 px-4 py-2 rounded-md',
    sm: 'h-8 rounded-md px-3 text-xs',
    lg: 'h-12 rounded-md px-8',
    icon: 'h-10 w-10 rounded-md'
  };

  const classes = `${baseClasses} ${variantClasses[variant] || variantClasses.default} ${sizeClasses[size] || sizeClasses.default} ${className}`;

  return (
    <button className={classes} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

// Simple badge component
const Badge = ({ children, variant = 'default', className = '' }) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    secondary: 'bg-gray-100 text-gray-800',
    outline: 'border border-gray-300 bg-white text-gray-800',
    destructive: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800'
  };

  const classes = `${baseClasses} ${variantClasses[variant] || variantClasses.default} ${className}`;

  return <span className={classes}>{children}</span>;
};

// Simple input component
const Input = ({ type = 'text', value, onChange, placeholder, className = '', ...props }) => {
  const classes = `flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`;

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={classes}
      {...props}
    />
  );
};

// Simple switch component
const Switch = ({ checked, onCheckedChange, id }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-orange-600' : 'bg-gray-300'
        }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
          }`}
      />
    </button>
  );
};

// Tabs components
const Tabs = ({ value, onValueChange, children, className = '' }) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { activeTab: value, setActiveTab: onValueChange })
      )}
    </div>
  );
};

const TabsList = ({ children, className = '' }) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1 ${className}`}>
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, children, disabled = false, className = '', activeTab, setActiveTab }) => {
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => !disabled && setActiveTab(value)}
      disabled={disabled}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all ${isActive
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, children, className = '', activeTab }) => {
  if (activeTab !== value) return null;

  return <div className={`mt-2 ${className}`}>{children}</div>;
};

// Card components
const Card = ({ children, className = '' }) => {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

const CardTitle = ({ children, className = '' }) => {
  return <h3 className={`text-xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
};

const CardDescription = ({ children, className = '' }) => {
  return <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;
};

const CardContent = ({ children, className = '' }) => {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
};

const CardFooter = ({ children, className = '' }) => {
  return <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>;
};

// Separator component
const Separator = ({ className = '' }) => {
  return <hr className={`border-t border-gray-200 ${className}`} />;
};

const RSSImport = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('manage');

  // Import state
  const [rssUrl, setRssUrl] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [previewItems, setPreviewItems] = useState([]);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveOptions, setSaveOptions] = useState({
    saveAsDraft: false,
    force: false,
    categoryFilter: ''
  });

  // History state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [totalHistoryPages, setTotalHistoryPages] = useState(1);

  // Configs state
  const [configs, setConfigs] = useState([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [newConfig, setNewConfig] = useState({
    name: '',
    url: '',
    brandName: '',
    isActive: true
  });
  const [addingConfig, setAddingConfig] = useState(false);

  // Clear history dialog
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);

  // Sample RSS feeds for quick access
  const sampleFeeds = [
    {
      name: 'Business Line - Markets',
      url: 'https://www.thehindubusinessline.com/markets/feeder/default.rss',
      description: 'Financial markets news'
    },
    {
      name: 'Economic Times - Markets',
      url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
      description: 'Stock market updates'
    },
    {
      name: 'MoneyControl - News',
      url: 'https://www.moneycontrol.com/rss/MCtopnews.xml',
      description: 'Financial news portal'
    }
  ];

  const handleParseRSS = async () => {
    if (!rssUrl.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a valid RSS feed URL',
        variant: 'destructive'
      });
      return;
    }

    setParsing(true);
    setParsedData(null);
    setPreviewItems([]);

    try {
      const adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in again to perform this action.',
          variant: 'destructive'
        });
        setParsing(false);
        return;
      }

      const response = await fetch(`${baseURL}/api/rss/parse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: rssUrl.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to parse RSS feed (${response.status})`);
      }

      if (data.success) {
        setParsedData(data.data);
        setPreviewItems(data.data.items || []);

        toast({
          title: 'Success',
          description: `Found ${data.data.count} items in RSS feed`,
          className: 'bg-green-100 text-green-800 border-green-200'
        });
      } else {
        throw new Error(data.message || 'Failed to parse RSS feed');
      }
    } catch (error) {
      console.error('Error parsing RSS:', error);
      toast({
        title: 'Parse Error',
        description: error.message || 'Failed to parse RSS feed',
        variant: 'destructive'
      });
    } finally {
      setParsing(false);
    }
  };

  const handleSaveRSSItems = async () => {
    if (!parsedData || previewItems.length === 0) {
      toast({
        title: 'No Items',
        description: 'No items to save. Please parse an RSS feed first.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);

    try {
      const adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in again to perform this action.',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }

      const response = await fetch(`${baseURL}/api/rss/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: rssUrl,
          items: previewItems,
          ...saveOptions
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to save items (${response.status})`);
      }

      if (data.success) {
        toast({
          title: 'Success',
          description: `Saved ${data.data.saved} items successfully. ${data.data.errors > 0 ? `${data.data.errors} errors occurred.` : ''}`,
          className: 'bg-green-100 text-green-800 border-green-200'
        });

        // Clear form after successful save
        setRssUrl('');
        setParsedData(null);
        setPreviewItems([]);

        // Switch to history tab
        setActiveTab('history');
        fetchHistory();
      } else {
        throw new Error(data.message || 'Failed to save items');
      }
    } catch (error) {
      console.error('Error saving RSS items:', error);
      toast({
        title: 'Save Error',
        description: error.message || 'Failed to save RSS items',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchHistory = async (page = 1) => {
    setLoadingHistory(true);

    try {
      const adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in again.',
          variant: 'destructive'
        });
        setLoadingHistory(false);
        return;
      }

      const response = await fetch(`${baseURL}/api/rss/history?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch history (${response.status})`);
      }

      if (data.success) {
        setHistory(data.data || []);
        setTotalHistoryPages(data.totalPages || 1);
        setHistoryPage(data.page || 1);
      } else {
        throw new Error(data.message || 'Failed to fetch history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: 'History Error',
        description: error.message || 'Failed to fetch RSS import history',
        variant: 'destructive'
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleClearHistory = async () => {
    setClearingHistory(true);

    try {
      const adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in again.',
          variant: 'destructive'
        });
        setClearingHistory(false);
        return;
      }

      const response = await fetch(`${baseURL}/api/rss/clear-history`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to clear history (${response.status})`);
      }

      if (data.success) {
        toast({
          title: 'History Cleared',
          description: `Deleted ${data.deletedCount} RSS imported posts`,
          className: 'bg-green-100 text-green-800 border-green-200'
        });

        fetchHistory(1);
        setClearDialogOpen(false);
      } else {
        throw new Error(data.message || 'Failed to clear history');
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: 'Clear Error',
        description: error.message || 'Failed to clear RSS import history',
        variant: 'destructive'
      });
    } finally {
      setClearingHistory(false);
    }
  };

  const handleSampleFeedClick = (url) => {
    setRssUrl(url);
    toast({
      title: 'Sample Feed Loaded',
      description: 'Click "Parse RSS Feed" to load items',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    });
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Config management functions
  const fetchConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${baseURL}/api/rss/configs`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await response.json();
      if (data.success) {
        setConfigs(data.data);
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const handleAddConfig = async (e) => {
    e.preventDefault();
    if (!newConfig.name || !newConfig.url || !newConfig.brandName) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setAddingConfig(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${baseURL}/api/rss/configs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'RSS Feed added successfully',
          className: 'bg-green-100 text-green-800 border-green-200'
        });
        setNewConfig({ name: '', url: '', brandName: '', isActive: true });
        fetchConfigs();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add feed',
        variant: 'destructive'
      });
    } finally {
      setAddingConfig(false);
    }
  };

  const handleDeleteConfig = async (id) => {
    if (!confirm('Are you sure you want to delete this feed config?')) return;

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${baseURL}/api/rss/configs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.ok) {
        toast({ title: 'Deleted', description: 'Feed configuration deleted' });
        fetchConfigs();
      }
    } catch (error) {
      console.error('Error deleting config:', error);
    }
  };

  const handleToggleConfig = async (config) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${baseURL}/api/rss/configs/${config._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !config.isActive })
      });

      if (response.ok) {
        fetchConfigs();
        toast({
          title: !config.isActive ? 'Feed Activated' : 'Feed Deactivated',
          description: !config.isActive ? 'Auto-fetching enabled' : 'Auto-fetching disabled'
        });
      }
    } catch (error) {
      console.error('Error toggling config:', error);
    }
  };

  const handleRunConfig = async (id) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${baseURL}/api/rss/configs/${id}/run`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.ok) {
        toast({
          title: 'Fetch Triggered',
          description: 'Background fetch started. Check import history shortly.',
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        });
      }
    } catch (error) {
      console.error('Error running config:', error);
    }
  };

  // Initialize history and configs on component mount
  React.useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    } else if (activeTab === 'manage') {
      fetchConfigs();
    }
  }, [activeTab]);





  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">RSS Feed Import</h1>
            <p className="text-gray-600 mt-1">
              Import news articles from RSS feeds automatically
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
              {user?.role === 'superadmin' ? 'Superadmin' : 'Admin'} Mode
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-1">
            {/* <TabsTrigger value="import" activeTab={activeTab} setActiveTab={setActiveTab} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import RSS
            </TabsTrigger>*/}
            <TabsTrigger value="manage" activeTab={activeTab} setActiveTab={setActiveTab} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage Feeds
            </TabsTrigger>
            {/* <TabsTrigger value="preview" disabled={!parsedData} activeTab={activeTab} setActiveTab={setActiveTab} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview ({previewItems.length})
            </TabsTrigger> */}
          </TabsList>

          {/* Manage Feeds Tab */}
          <TabsContent value="manage" activeTab={activeTab} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  Manage RSS Feeds
                </CardTitle>
                <CardDescription>
                  Configure automated RSS feed fetching
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Feed Form */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add New Feed
                  </h3>
                  <form onSubmit={handleAddConfig} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Feed Name</label>
                      <Input
                        placeholder="e.g. Business Line"
                        value={newConfig.name}
                        onChange={e => setNewConfig({ ...newConfig, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">RSS URL</label>
                      <Input
                        placeholder="https://..."
                        value={newConfig.url}
                        onChange={e => setNewConfig({ ...newConfig, url: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Brand Name (Author)</label>
                      <Input
                        placeholder="e.g. Hindu Business Line"
                        value={newConfig.brandName}
                        onChange={e => setNewConfig({ ...newConfig, brandName: e.target.value })}
                      />
                    </div>
                    <Button type="submit" disabled={addingConfig} className="bg-orange-600 hover:bg-orange-700">
                      {addingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Feed'}
                    </Button>
                  </form>
                </div>

                <Separator />

                {/* Feeds List */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Saved Feeds</h3>

                  {loadingConfigs ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                    </div>
                  ) : configs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No saved feeds found. Add one above.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {configs.map(config => (
                        <div key={config._id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-sm">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-lg">{config.name}</h4>
                              <Badge variant={config.isActive ? "green" : "secondary"}>
                                {config.isActive ? 'Active' : 'Paused'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 truncate max-w-md" title={config.url}>{config.url}</p>
                            <p className="text-xs text-gray-400 mt-1">Author: {config.brandName}</p>

                            {config.lastFetchedAt && (
                              <div className="flex items-center gap-2 mt-2 text-xs">
                                <span className={config.lastFetchStatus === 'error' ? 'text-red-600' : 'text-green-600'}>
                                  Last fetch: {new Date(config.lastFetchedAt).toLocaleString()}
                                </span>
                                {config.lastErrorMessage && (
                                  <span className="text-red-500 truncate max-w-xs" title={config.lastErrorMessage}>
                                    - {config.lastErrorMessage}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRunConfig(config._id)}
                              title="Run Now"
                            >
                              <Play className="h-4 w-4 text-blue-600" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleConfig(config)}
                              title={config.isActive ? "Pause Auto-Fetch" : "Enable Auto-Fetch"}
                            >
                              {config.isActive ? (
                                <Pause className="h-4 w-4 text-orange-600" />
                              ) : (
                                <Play className="h-4 w-4 text-green-600" />
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteConfig(config._id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import Tab */}
          {/* <TabsContent value="import" activeTab={activeTab} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-orange-600" />
                  RSS Feed URL
                </CardTitle>
                <CardDescription>
                  Enter the URL of an RSS feed to import articles from
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="rss-url" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    RSS Feed URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="rss-url"
                      type="url"
                      placeholder="https://example.com/feed.rss"
                      value={rssUrl}
                      onChange={(e) => setRssUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleParseRSS}
                      disabled={parsing || !rssUrl.trim()}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {parsing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Parsing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Parse RSS Feed
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                
                <div className="space-y-2">
                  <label className="text-sm text-gray-500">Quick Sample Feeds</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {sampleFeeds.map((feed) => (
                      <Button
                        key={feed.url}
                        variant="outline"
                        className="h-auto py-3 px-4 justify-start text-left hover:border-orange-300 hover:bg-orange-50"
                        onClick={() => handleSampleFeedClick(feed.url)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{feed.name}</div>
                          <div className="text-xs text-gray-500 truncate mt-1">{feed.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

               
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    How It Works
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                    <li>Enter a valid RSS feed URL (XML format)</li>
                    <li>Click "Parse RSS Feed" to fetch and parse the feed</li>
                    <li>Preview the parsed articles in the Preview tab</li>
                    <li>Configure import options and save as posts</li>
                    <li>Posts can be saved as drafts or published directly</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
           

            
            {parsedData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Parse Successful
                  </CardTitle>
                  <CardDescription>
                    Found {parsedData.count} items in the RSS feed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Items</span>
                        <Badge variant="outline" className="font-mono">
                          {parsedData.count}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Preview Items</span>
                        <Badge variant="outline" className="font-mono">
                          {previewItems.length}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setActiveTab('preview')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Preview
                      </Button>
                      <Button
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        onClick={() => setActiveTab('preview')}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Continue to Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent> */}

          {/* Preview Tab */}
          <TabsContent value="preview" activeTab={activeTab} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-orange-600" />
                    Preview Items ({previewItems.length})
                  </div>
                  <Badge variant="outline">
                    {previewItems.length} items to import
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Review and configure import options before saving
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Import Options */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h3 className="font-semibold text-gray-800">Import Options</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <label htmlFor="save-as-draft" className="text-sm font-medium">
                          Save as Draft
                        </label>
                        <p className="text-xs text-gray-500">
                          Import items as draft posts (recommended)
                        </p>
                      </div>
                      <Switch
                        id="save-as-draft"
                        checked={saveOptions.saveAsDraft}
                        onCheckedChange={(checked) =>
                          setSaveOptions(prev => ({ ...prev, saveAsDraft: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <label htmlFor="force-import" className="text-sm font-medium">
                          Force Import
                        </label>
                        <p className="text-xs text-gray-500">
                          Import even if duplicates exist
                        </p>
                      </div>
                      <Switch
                        id="force-import"
                        checked={saveOptions.force}
                        onCheckedChange={(checked) =>
                          setSaveOptions(prev => ({ ...prev, force: checked }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="category-filter" className="text-sm font-medium">
                      Filter by Category (Optional)
                    </label>
                    <Input
                      id="category-filter"
                      placeholder="e.g., Forex, Markets, Stocks"
                      value={saveOptions.categoryFilter}
                      onChange={(e) =>
                        setSaveOptions(prev => ({ ...prev, categoryFilter: e.target.value }))
                      }
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Only import items containing this text in their categories
                    </p>
                  </div>
                </div>

                {/* Preview Items */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Items to Import</h3>

                  {previewItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No items to preview</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {previewItems.map((item, index) => (
                        <div
                          key={item.guid || index}
                          className="border rounded-lg p-4 hover:border-orange-300 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-start gap-4">
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full md:w-32 h-32 object-cover rounded-lg flex-shrink-0"
                              />
                            )}

                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 line-clamp-2">
                                {item.title}
                              </h4>

                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {truncateText(item.description, 150)}
                              </p>

                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                {item.categories && item.categories.slice(0, 3).map((cat, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {cat}
                                  </Badge>
                                ))}

                                {item.pubDate && (
                                  <Badge variant="outline" className="text-xs">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(item.pubDate)}
                                  </Badge>
                                )}

                                {item.link && (
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-orange-600 hover:text-orange-700 flex items-center"
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Source
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between border-t pt-6">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('import')}
                  className="w-full sm:w-auto"
                >
                  Back to Import
                </Button>

                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setParsedData(null);
                      setPreviewItems([]);
                      setActiveTab('import');
                    }}
                    className="flex-1 sm:flex-none"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Parse Another Feed
                  </Button>

                  <Button
                    onClick={handleSaveRSSItems}
                    disabled={saving || previewItems.length === 0}
                    className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save {previewItems.length} Items
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Clear History Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle>Clear RSS Import History</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              This action will permanently delete all posts imported from RSS feeds.
              This cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearHistory}
              disabled={clearingHistory}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {clearingHistory ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Clear History'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default RSSImport;