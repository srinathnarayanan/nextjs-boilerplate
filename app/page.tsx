"use client";
import React, { useState, useEffect } from 'react';
import { TextField, Stack, PrimaryButton, Spinner } from '@fluentui/react';
import ReactMarkdown from 'react-markdown';

const MyApp = () => {
  const [token, setToken] = useState<string|undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [inputValue, setInputValue] = useState<string|undefined>('');
  const [outputValue, setOutputValue] = useState<string|undefined>('');


  const fetchToken = async (): Promise<string> => {
      const cloudFunctionToken = process.env.NEXT_PUBLIC_CLOUD_FUNCTION_TOKEN
      if (cloudFunctionToken) {
        return cloudFunctionToken
      }
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

  const makeFunctionCall = async (path: string, authToken: string, method: string, body: string | undefined) => {
    const params : RequestInit = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    }
    if (body) {
      const requestBody = {
        query: body,
      };
      params.body = JSON.stringify(requestBody)
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_NOVA_GATEWAY_ENDPOINT}/functions/${process.env.NEXT_PUBLIC_CLOUD_FUNCTION_ID}${path}`, params);
    const responseString = await response.text()
    if (!response.ok) {
      throw new Error(`Invalid request. Error: ${responseString}`);
    }
    return responseString
  };

  useEffect(() => {
    const initAuthProcess = async () => {
      let authToken
      try {
        authToken = await getToken();
        await makeFunctionCall("/", authToken, 'GET', undefined);
      } catch (err) {
        console.log(err)
        try {
          authToken = await fetchToken();
          await makeFunctionCall("/", authToken, 'GET', undefined);
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
  }, [token]);

  const handleButtonClick = async () => {
    if (!token) {
      throw new Error("Invalid token")
    }
    setSubmitting(true)
    setOutputValue(undefined)
    const response = await makeFunctionCall(`${process.env.NEXT_PUBLIC_CLOUD_FUNCTION_PATH}`, token, 'POST', inputValue);
    const trimmedText = response.replace(/^["']|["']$/g, '').trim();
    const formattedText = trimmedText
      .replace(/\\n\\n/g, '\n\n') // Replace double escaped line breaks with actual line breaks
      .replace(/\\n/g, '\n')      // Replace single escaped line breaks with a space
      .replace(/^\s*\-\s+/gm, '- ') // Ensure proper spacing for bullet points
      .replace(/^(#+)\s+/gm, '$1 ') // Ensure there's a space after the hashtag in headings

    setOutputValue(formattedText);
    setSubmitting(false)
  };


  let loadingElement
  if (loading) {
    return (
      loadingElement = <Spinner label="Authorizing..." />
    );
  }

  let errorElement
  if (error) {
    return (
      errorElement = <div>{error}</div>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 15 }} styles={{ root: { maxWidth: 600, margin: '0 auto', padding: 20,  } }}>
      {loadingElement}
      {errorElement}
      {/* Input TextArea */}
      <TextField
        label="What do you seek?"
        disabled={submitting}
        multiline
        rows={4}
        value={inputValue}
        onChange={(e, newValue) => setInputValue(newValue)}
        styles={{ fieldGroup: { width: '100%' } }}
      />
      
      <PrimaryButton disabled={submitting || !inputValue} onClick={handleButtonClick} styles={{ root: { alignSelf: 'center' } }}>
        {submitting ? <Spinner/> : "Submit"}
      </PrimaryButton>

      {/* Conditionally render the output paragraph with title */}
      {outputValue && (
        <Stack tokens={{ childrenGap: 10 }}>
          <h2 >
            Response:
          </h2>

          <div style={{ backgroundColor: '#f4f4f4', padding: 10, borderRadius: 5 }}>
            <ReactMarkdown>{outputValue}</ReactMarkdown>
          </div>
        </Stack>
      )}
    </Stack>
  );
};

export default MyApp;
