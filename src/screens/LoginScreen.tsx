import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { TextInput, Button, Title, Surface } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation';

type Props = StackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <Text style={styles.header}>Goalshare</Text>
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
            disabled={loading}
          >
            Don't have an account? Sign Up
          </Button>
        </Surface>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#000000',
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
    alignSelf: 'center',
  },
});

export default LoginScreen;
