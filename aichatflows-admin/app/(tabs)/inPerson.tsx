import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserPlus, Check, Eye, Trash2, Users } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, ClientFormData, InPersonSubmission } from '../../src/types';
import { useClients } from '../../src/hooks/useClients';
import { validateClient } from '../../src/utils/validation';
import { 
  Button, 
  Input, 
  FormField, 
  Card, 
  StatusBadge, 
  EmptyState,
  SimpleFormModal
} from '../../src/components';
import { CombinedClientBadges } from '../../src/components/Badges';
import { useActivityLog } from '../../src/hooks/useActivityLog';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function InPersonScreen() {
  const { theme, themeClasses } = useTheme();
  const { clients, createClient, loading: clientsLoading } = useClients();
  const { logInPersonSignup, logClientCreated } = useActivityLog();
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [inPersonSubmissions, setInPersonSubmissions] = useState<InPersonSubmission[]>([]);
  const [showSubmissionModal, setShowSubmissionModal] = useState<InPersonSubmission | null>(null);

  // New client form data with in-person flag
  const [newClient, setNewClient] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    status: 'active',
    instagram_handle: '',
    facebook_url: '',
    tiktok_handle: '',
    delivery_preference: 'delivery',
    platform_preference: 'instagram',
    plan: 'starter',
    payment_status: 'unpaid',
    signed_in_person: true, // Always true for in-person signups
    payment_method: '',
    notes: '',
    business_name: '',
    other_platforms: '',
    business_type: '',
    business_niche: '',
    common_customer_question: '',
    products_or_services: '',
    has_faqs: false,
    consent_to_share: false,
    instagram_password: '',
    facebook_password: '',
    tiktok_password: '',
    delivery_method: '',
    delivery_notes: '',
    pickup_method: '',
    pickup_notes: '',
    photo_url: '',
  });

  // Load in-person submissions from localStorage
  useEffect(() => {
    loadInPersonSubmissions();
  }, []);

  const loadInPersonSubmissions = async () => {
    try {
      const stored = await AsyncStorage.getItem('in_person_submissions');
      if (stored) {
        setInPersonSubmissions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading in-person submissions:', error);
    }
  };

  const saveInPersonSubmissions = async (submissions: InPersonSubmission[]) => {
    try {
      await AsyncStorage.setItem('in_person_submissions', JSON.stringify(submissions));
      setInPersonSubmissions(submissions);
    } catch (error) {
      console.error('Error saving in-person submissions:', error);
    }
  };

  const resetForm = () => {
    setNewClient({
      name: '',
      email: '',
      phone: '',
      status: 'active',
      instagram_handle: '',
      facebook_url: '',
      tiktok_handle: '',
      delivery_preference: 'delivery',
      platform_preference: 'instagram',
      plan: 'starter',
      payment_status: 'unpaid',
      signed_in_person: true,
      payment_method: '',
      notes: '',
      business_name: '',
      other_platforms: '',
      business_type: '',
      business_niche: '',
      common_customer_question: '',
      products_or_services: '',
      has_faqs: false,
      consent_to_share: false,
      instagram_password: '',
      facebook_password: '',
      tiktok_password: '',
      delivery_method: '',
      delivery_notes: '',
      pickup_method: '',
      pickup_notes: '',
      photo_url: '',
    });
    setValidationErrors({});
  };

  const handleSubmitInPersonSignup = async () => {
    try {
      setSubmitting(true);
      
      // Validate the form
      const validation = validateClient(newClient);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setSubmitting(false);
        return;
      }

      // Create in-person submission record
      const submission: InPersonSubmission = {
        id: `in_person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        form_data: { ...newClient },
        submitted_at: new Date().toISOString(),
        converted_to_client: false,
      };

      // Save to local storage
      const updated = [...inPersonSubmissions, submission];
      saveInPersonSubmissions(updated);

      // Log the in-person signup activity
      logInPersonSignup(newClient.name, newClient.plan || 'starter');

      resetForm();
      setShowSignupForm(false);
      
      Alert.alert(
        '✅ In-Person Signup Recorded!',
        'The signup has been saved. You can now convert it to a client profile when ready.',
        [
          { text: 'OK', onPress: () => {} }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', `Failed to record signup: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertToClient = async (submission: InPersonSubmission) => {
    try {
      setSubmitting(true);
      
      // Create the client
      const clientData = {
        ...submission.form_data,
        signed_in_person: true // Ensure in-person flag is set
      };
      
      const newClientResponse = await createClient(clientData);
      
      if (newClientResponse) {
        // Mark submission as converted
        const updatedSubmissions = inPersonSubmissions.map(sub => 
          sub.id === submission.id 
            ? { ...sub, converted_to_client: true, client_id: newClientResponse.id }
            : sub
        );
        saveInPersonSubmissions(updatedSubmissions);
        
        // Log the client creation from in-person signup
        logClientCreated(
          newClientResponse.id,
          submission.form_data.name,
          submission.form_data.plan || 'starter',
          true // This is from in-person signup
        );
        
        Alert.alert(
          '🎉 Client Created!',
          `${submission.form_data.name} has been added to your client database.`,
          [{ text: 'Great!' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to create client: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmission = (submissionId: string) => {
    Alert.alert(
      'Delete Submission',
      'Are you sure you want to delete this in-person signup?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = inPersonSubmissions.filter(sub => sub.id !== submissionId);
            saveInPersonSubmissions(updated);
          }
        }
      ]
    );
  };

  const pendingSubmissions = inPersonSubmissions.filter(sub => !sub.converted_to_client);
  const convertedSubmissions = inPersonSubmissions.filter(sub => sub.converted_to_client);

  return (
    <SafeAreaView className={`flex-1 ${themeClasses.bg.secondary} theme-${theme}`}>
      <ScrollView className="flex-1 px-page py-section">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <View>
            <Text className="text-3xl font-bold text-text-primary">In-Person Signups</Text>
            <Text className="text-text-muted mt-1">
              {pendingSubmissions.length} pending • {convertedSubmissions.length} converted
            </Text>
          </View>
          <TouchableOpacity
            className="btn-primary flex-row items-center"
            onPress={() => setShowSignupForm(true)}
          >
            <UserPlus size={20} color="white" />
            <Text className="text-white font-semibold ml-2">New Signup</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View className="flex-row gap-4 mb-8">
          <View className={`card-primary flex-1 theme-${theme}`}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-blue-600">{pendingSubmissions.length}</Text>
                <Text className={`${themeClasses.text.muted} text-sm`}>Pending Conversion</Text>
              </View>
              <UserPlus size={20} color={theme === 'teal' ? '#0D9488' : '#3B82F6'} />
            </View>
          </View>
          <View className={`card-primary flex-1 theme-${theme}`}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-green-600">{convertedSubmissions.length}</Text>
                <Text className={`${themeClasses.text.muted} text-sm`}>Converted Clients</Text>
              </View>
              <Check size={20} color="#10B981" />
            </View>
          </View>
        </View>

        {/* Pending Submissions */}
        {pendingSubmissions.length > 0 && (
          <View className="mb-8">
            <Text className="text-xl font-bold text-text-primary mb-4">
              🔄 Pending Conversions ({pendingSubmissions.length})
            </Text>
            {pendingSubmissions.map((submission) => (
              <Card key={submission.id}>
                <View className="p-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-text-primary">
                        {submission.form_data.name}
                      </Text>
                      {submission.form_data.business_name && (
                        <Text className="text-text-secondary">
                          {submission.form_data.business_name}
                        </Text>
                      )}
                      <Text className="text-text-muted text-sm">
                        {submission.form_data.email} • {submission.form_data.phone}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className="p-2 bg-blue-100 rounded-lg"
                        onPress={() => setShowSubmissionModal(submission)}
                      >
                        <Eye size={16} color="#3B82F6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="p-2 bg-red-100 rounded-lg"
                        onPress={() => handleDeleteSubmission(submission.id)}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="mb-3">
                    <CombinedClientBadges 
                      client={{
                        ...submission.form_data,
                        id: submission.id,
                        created_at: submission.submitted_at,
                        updated_at: submission.submitted_at
                      } as Client}
                      size="sm"
                    />
                  </View>

                  <View className="flex-row gap-3">
                    <Button
                      onPress={() => handleConvertToClient(submission)}
                      variant="primary"
                      size="sm"
                      disabled={submitting}
                    >
                      Convert to Client
                    </Button>
                    <Text className="text-text-muted text-xs mt-2">
                      Signed up {new Date(submission.submitted_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Converted Submissions */}
        {convertedSubmissions.length > 0 && (
          <View className="mb-8">
            <Text className="text-xl font-bold text-text-primary mb-4">
              ✅ Converted to Clients ({convertedSubmissions.length})
            </Text>
            {convertedSubmissions.map((submission) => (
              <Card key={submission.id}>
                <View className="p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-text-primary">
                        {submission.form_data.name}
                      </Text>
                      {submission.form_data.business_name && (
                        <Text className="text-text-secondary">
                          {submission.form_data.business_name}
                        </Text>
                      )}
                      <Text className="text-text-muted text-sm">
                        Converted {new Date(submission.submitted_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Check size={20} color="#10B981" />
                      <Text className="text-green-600 text-sm font-medium ml-1">Converted</Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Empty State */}
        {inPersonSubmissions.length === 0 && (
          <EmptyState
            icon="people"
            title="No In-Person Signups Yet"
            description="Start collecting client information at events, meetings, or in-person encounters."
            action={{
              label: "Record First Signup",
              onPress: () => setShowSignupForm(true)
            }}
          />
        )}
      </ScrollView>

      {/* In-Person Signup Form Modal */}
      <SimpleFormModal
        visible={showSignupForm}
        onClose={() => {
          setShowSignupForm(false);
          resetForm();
        }}
        title="🤝 In-Person Signup"
        fullScreen={true}
        size="lg"
      >
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="space-y-4 px-6 py-4">
          {/* Basic Information */}
          <FormField
            label="Full Name *"
            error={validationErrors.name}
          >
            <Input
              placeholder="Enter client's full name"
              value={newClient.name}
              onChangeText={(text) => setNewClient({ ...newClient, name: text })}
            />
          </FormField>

          <FormField
            label="Email Address *"
            error={validationErrors.email}
          >
            <Input
              placeholder="Enter email address"
              value={newClient.email}
              onChangeText={(text) => setNewClient({ ...newClient, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </FormField>

          <FormField
            label="Phone Number *"
            error={validationErrors.phone}
          >
            <Input
              placeholder="Enter phone number"
              value={newClient.phone}
              onChangeText={(text) => setNewClient({ ...newClient, phone: text })}
              keyboardType="phone-pad"
            />
          </FormField>

          <FormField
            label="Business Name"
            error={validationErrors.business_name}
          >
            <Input
              placeholder="Enter business name (optional)"
              value={newClient.business_name}
              onChangeText={(text) => setNewClient({ ...newClient, business_name: text })}
            />
          </FormField>

          {/* Plan Selection */}
          <FormField label="Plan">
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 p-3 rounded-lg border-2 ${
                  newClient.plan === 'starter' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white'
                }`}
                onPress={() => setNewClient({ ...newClient, plan: 'starter' })}
              >
                <Text className={`font-medium text-center ${
                  newClient.plan === 'starter' ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  Starter • $100
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 p-3 rounded-lg border-2 ${
                  newClient.plan === 'pro' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 bg-white'
                }`}
                onPress={() => setNewClient({ ...newClient, plan: 'pro' })}
              >
                <Text className={`font-medium text-center ${
                  newClient.plan === 'pro' ? 'text-purple-700' : 'text-gray-700'
                }`}>
                  Pro • $150
                </Text>
              </TouchableOpacity>
            </View>
          </FormField>

          {/* Platform Preference */}
          <FormField label="Platform Preference">
            <View className="flex-row gap-2">
              {(['instagram', 'facebook', 'tiktok'] as const).map((platform) => (
                <TouchableOpacity
                  key={platform}
                  className={`flex-1 p-2 rounded-lg border ${
                    newClient.platform_preference === platform
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 bg-white'
                  }`}
                  onPress={() => setNewClient({ ...newClient, platform_preference: platform })}
                >
                  <Text className={`text-xs font-medium text-center capitalize ${
                    newClient.platform_preference === platform ? 'text-primary' : 'text-gray-600'
                  }`}>
                    {platform}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormField>

          <FormField
            label="Notes"
            error={validationErrors.notes}
          >
            <Input
              placeholder="Any additional notes about this signup..."
              value={newClient.notes}
              onChangeText={(text) => setNewClient({ ...newClient, notes: text })}
              multiline
              numberOfLines={3}
            />
          </FormField>

          {/* Submit Button */}
          <View className="pt-4">
            <Button
              onPress={handleSubmitInPersonSignup}
              variant="primary"
              disabled={submitting}
              loading={submitting}
            >
              Record Signup
            </Button>
          </View>
          </View>
        </ScrollView>
      </SimpleFormModal>

      {/* Submission Detail Modal */}
      {showSubmissionModal && (
        <SimpleFormModal
          visible={true}
          onClose={() => setShowSubmissionModal(null)}
          title="Signup Details"
          fullScreen={true}
          size="lg"
        >
          <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="space-y-4 px-6 py-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Name</Text>
              <Text className="text-base text-gray-900">{showSubmissionModal.form_data.name}</Text>
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
              <Text className="text-base text-gray-900">{showSubmissionModal.form_data.email}</Text>
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Phone</Text>
              <Text className="text-base text-gray-900">{showSubmissionModal.form_data.phone}</Text>
            </View>
            {showSubmissionModal.form_data.business_name && (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Business</Text>
                <Text className="text-base text-gray-900">{showSubmissionModal.form_data.business_name}</Text>
              </View>
            )}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Plan</Text>
              <Text className="text-base text-gray-900 capitalize">{showSubmissionModal.form_data.plan}</Text>
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Platform</Text>
              <Text className="text-base text-gray-900 capitalize">{showSubmissionModal.form_data.platform_preference}</Text>
            </View>
            {showSubmissionModal.form_data.notes && (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Notes</Text>
                <Text className="text-base text-gray-900">{showSubmissionModal.form_data.notes}</Text>
              </View>
            )}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Submitted</Text>
              <Text className="text-base text-gray-900">
                {new Date(showSubmissionModal.submitted_at).toLocaleDateString()} at{' '}
                {new Date(showSubmissionModal.submitted_at).toLocaleTimeString()}
              </Text>
            </View>

            {/* Close Button */}
            <View className="pt-4">
              <Button
                onPress={() => setShowSubmissionModal(null)}
                variant="secondary"
              >
                Close
              </Button>
            </View>
            </View>
          </ScrollView>
        </SimpleFormModal>
      )}
    </SafeAreaView>
  );
}