import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { FormSubmission } from '../../src/types';

const mockSubmission: FormSubmission = {
  id: '1',
  client_id: '1',
  email: 'john@techcorp.com',
  status: 'pending',
  submitted_at: '2024-01-15T10:30:00Z',
  client: {
    id: '1',
    name: 'Tech Corp',
    email: 'john@techcorp.com',
    phone: '+1 (555) 123-4567',
    status: 'in_progress',
    created_at: '2024-01-15T10:30:00Z',
  },
};

export default function SubmissionDetailsScreen() {
  const { id } = useLocalSearchParams();

  const renderField = (label: string, value: string | string[]) => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      {Array.isArray(value) ? (
        <View className="flex-row flex-wrap">
          {value.map((item, index) => (
            <View key={index} className="bg-blue-100 px-3 py-1 rounded-full mr-2 mb-2">
              <Text className="text-blue-800 text-sm">{item}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-gray-900 text-base">{value}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="px-6 py-4">
          {/* Header with Back Button */}
          <TouchableOpacity
            className="flex-row items-center mb-6"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#00D4AA" />
            <Text className="text-primary text-lg ml-2">Back to Submissions</Text>
          </TouchableOpacity>

          {/* Header */}
          <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {mockSubmission.client?.name || mockSubmission.email}
                </Text>
                <Text className="text-gray-600">
                  Submitted: {new Date(mockSubmission.submitted_at).toLocaleDateString()}
                </Text>
              </View>
              <View className="bg-green-100 p-3 rounded-full">
                <Ionicons name="checkmark-circle" size={24} color="#34C759" />
              </View>
            </View>
          </View>

          {/* Submission Information */}
          <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Submission Details
            </Text>
            {renderField('Email', mockSubmission.email)}
            {renderField('Status', mockSubmission.status)}
            {renderField('Submitted At', new Date(mockSubmission.submitted_at).toLocaleString())}
          </View>

          {/* Client Information */}
          {mockSubmission.client && (
            <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Client Information
              </Text>
              {renderField('Client Name', mockSubmission.client.name)}
              {renderField('Client Email', mockSubmission.client.email)}
              {renderField('Phone', mockSubmission.client.phone)}
              {renderField('Client Status', mockSubmission.client.status)}
            </View>
          )}

          {/* Note: form_data field doesn't exist in new schema */}
          <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <Text className="text-yellow-800 text-sm">
              Note: The new schema only stores basic submission data. Detailed form fields are not available.
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row space-x-4 mb-6">
            <TouchableOpacity className="bg-primary rounded-lg py-4 flex-1">
              <Text className="text-white text-center font-semibold">
                Contact Client
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-green-600 rounded-lg py-4 flex-1">
              <Text className="text-white text-center font-semibold">
                Mark as Active
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}