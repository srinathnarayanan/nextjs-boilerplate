"use client";
import React, { useState, useEffect } from 'react';
import { TextField, Stack, PrimaryButton, Spinner } from '@fluentui/react';

const MyApp = () => {
  const [token, setToken] = useState<string|undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [inputValue, setInputValue] = useState<string|undefined>('');
  const [outputValue, setOutputValue] = useState<string|undefined>('');


  const fetchToken = async (): Promise<string> => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MANAGEMENT_API_ENDPOINT}/v1/codeservices/${process.env.NEXT_PUBLIC_CLOUD_FUNCTION_ID}/token`,{
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      const newToken = result["jwt"]
      localStorage.setItem('vercelAppAuthToken', newToken);
      return newToken
  };
  
  const getToken = async () : Promise<string>=> {
      const storedToken = localStorage.getItem('vercelAppAuthToken');
      if (storedToken) {
        return storedToken
      }
      return await fetchToken();
  };

  const makeFunctionCall = async (path: string, authToken: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_NOVA_GATEWAY_ENDPOINT}/functions/${process.env.NEXT_PUBLIC_CLOUD_FUNCTION_ID}${path}`,{
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });
    const responseString = await response.text()
    if (!response.ok) {
      throw new Error(`Invalid request. Error: ${responseString}`);
    }
    return responseString
  };

  useEffect(() => {
    const initAuthProcess = async () => {
      var authToken
      try {
        authToken = await getToken();
        await makeFunctionCall("/", authToken);
      } catch (err) {
        console.log(err)
        try {
          authToken = await fetchToken();
          await makeFunctionCall("/", authToken);
        } catch (err) {
          console.log(err)
          setError(`Failed to execute request. Error: ${err}`)
        }
      }
      if (token != authToken) {
        setToken(authToken)
      }
      setLoading(false);
    };
    initAuthProcess();
  }, []);

  const handleButtonClick = async () => {
    if (!token) {
      throw new Error("Invalid token")
    }
    setSubmitting(true)
    const response = await makeFunctionCall(`${process.env.NEXT_PUBLIC_CLOUD_FUNCTION_PATH}`, token);
    setOutputValue(response);
    setSubmitting(false)
  };


  var loadingElement
  if (loading) {
    return (
      loadingElement = <Spinner label="Authorizing..." />
    );
  }

  var errorElement
  if (error) {
    return (
      errorElement = <div>{error}</div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Stack horizontal styles={{ root: { width: '80%', maxWidth: '800px', alignItems: 'flex-start' } }} tokens={{ childrenGap: 20 }}>
        <>{loadingElement}</>
        <>{errorElement}</>
        <Stack.Item grow>
          <TextField
            label="Input Text"
            multiline
            rows={4}
            value={inputValue}
            onChange={(e, newValue) => setInputValue(newValue)}
          />
          <PrimaryButton disabled={submitting} onClick={handleButtonClick} style={{ marginTop: '10px' }} >
            {submitting ? <Spinner/> : "Submit"}
          </PrimaryButton>
        </Stack.Item>
        <TextField
          label="Output Text"
          multiline
          rows={4}
          value={outputValue}
          readOnly
        />
      </Stack>
    </div>
  );
};

export default MyApp;
