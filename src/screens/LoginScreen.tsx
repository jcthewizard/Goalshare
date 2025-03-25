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
  const { login, loginDev } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
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
          disabled={loading}
          style={styles.button}
        >
          Log In
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Register')}
          style={styles.linkButton}
        >
          Don't have an account? Sign Up
        </Button>

        <Divider style={styles.divider} />

        <Text style={styles.devText}>Development Options:</Text>

        <Button
          mode="outlined"
          onPress={handleFillDevCredentials}
          style={styles.devButton}
        >
          Fill Dev Credentials
        </Button>

        <Button
          mode="outlined"
          onPress={handleDevLogin}
          style={styles.devButton}
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