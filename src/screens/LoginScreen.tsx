import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Title, Surface, Text, Divider } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation';

type Props = StackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const { login, loginDev, register } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      console.log('Login successful');
    } catch (error) {
      console.error('Login error:', error);
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

        <Text style={styles.devText}>Development Options:</Text>

        <Button
          mode="outlined"
          onPress={handleFillDevCredentials}
          style={styles.devButton}
          disabled={loading || registerLoading}
        >
          Fill Dev Credentials
        </Button>

        <Button
          mode="outlined"
          onPress={handleDevLogin}
          style={styles.devButton}
          disabled={loading || registerLoading}
        >
          Direct Login (No Firebase)
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