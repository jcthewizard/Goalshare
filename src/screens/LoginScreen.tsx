import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Title, Surface, Text, Divider } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation';

// Import the NetworkDebug utility
import NetworkDebug from '../utils/NetworkDebug';

type Props = StackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const { login, loginDev, register } = useAuth();

  // Add network diagnostic function
  const runNetworkDiagnostics = async () => {
    setDiagnosing(true);
    
    try {
      Alert.alert('Network Diagnostics', 'Running network tests... Check console logs for results.');
      
      // Get API URL from the same place the auth context does
      // This is a bit of a hack - in a real app you'd use a config system that both can access
      const API_BASE = `http://${process.env.IP}:5001/api`;

      
      // Run full diagnostics
      await NetworkDebug.runFullDiagnostics(API_BASE + '/api/health');
      
      Alert.alert('Diagnostics Complete', 'Network diagnostics completed. Check console logs for detailed results.');
    } catch (error) {
      console.error('Diagnostic error:', error);
      Alert.alert('Diagnostic Error', 'An error occurred during network diagnostics.');
    } finally {
      setDiagnosing(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    console.log('🔄 UI: Login attempt started with email:', email);

    try {
      await login(email, password);
      console.log('✅ UI: Login successful');
    } catch (error) {
      console.error('❌ UI: Login error:', error);
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setRegisterLoading(true);
    
    try {
      await register(email, password, email.split('@')[0]);
      Alert.alert('Success', 'Account created successfully!');
      console.log('Registration successful');
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleDevLogin = () => {
    console.log('🔄 UI: Using dev login bypass');
    loginDev();
  };

  const handleFillDevCredentials = () => {
    setEmail('dev@example.com');
    setPassword('password');
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.formContainer}>
        <Title style={styles.title}>Log In</Title>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading || registerLoading}
          style={styles.button}
        >
          Log In
        </Button>

        <Button
          mode="outlined"
          onPress={handleRegister}
          loading={registerLoading}
          disabled={loading || registerLoading}
          style={styles.registerButton}
        >
          Register with these credentials
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Register')}
          style={styles.linkButton}
          disabled={loading || registerLoading}
        >
          Don't have an account? Sign Up
        </Button>

        <Divider style={styles.divider} />

        <Text style={styles.devText}>Development Options (Use these while MongoDB is unavailable):</Text>

        <Button
          mode="outlined"
          onPress={handleFillDevCredentials}
          style={styles.devButton}
          disabled={loading || registerLoading}
        >
          Fill Dev Credentials
        </Button>

        <Button
          mode="contained"
          onPress={handleDevLogin}
          style={[styles.devButton, { backgroundColor: '#4CAF50' }]}
          labelStyle={{ color: 'white' }}
          disabled={loading || registerLoading}
        >
          Use Direct Login (Bypass Backend)
        </Button>
        
        <Divider style={[styles.divider, { marginTop: 16 }]} />
        
        <Button
          mode="outlined"
          onPress={runNetworkDiagnostics}
          loading={diagnosing}
          disabled={diagnosing}
          style={[styles.devButton, { borderColor: '#2196F3' }]}
        >
          Run Network Diagnostics
        </Button>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 20,
    borderRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginVertical: 8,
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
  registerButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 15,
  },
  divider: {
    marginTop: 24,
    marginBottom: 12,
  },
  devText: {
    textAlign: 'center',
    marginBottom: 12,
    color: '#666',
  },
  devButton: {
    marginVertical: 6,
    backgroundColor: '#f0f0f0',
  },
});

export default LoginScreen;