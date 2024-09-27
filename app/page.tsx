"use client";
import ReactMarkdown from 'react-markdown';
import React, { useState, useEffect } from 'react'
import {
  initializeIcons,
  Stack,
  TextField,
  PrimaryButton,
  Spinner,
} from '@fluentui/react'

// Initialize icons
initializeIcons()

/*
interface ChatMessage {
  id: string;
  question: string;
  answer?: string;
}

const theme: ITheme = createTheme({
  palette: {
    themePrimary: '#0078d4',
    themeLighterAlt: '#f3f9fd',
    themeLighter: '#d0e7f8',
    themeLight: '#a9d3f2',
    themeTertiary: '#5ca9e5',
    themeSecondary: '#1a86d9',
    themeDarkAlt: '#006cbe',
    themeDark: '#005ba1',
    themeDarker: '#004377',
  },
})

const classNames = mergeStyleSets({
  container: {
    height: '100vh',
    display: 'flex',
    backgroundColor: theme.palette.neutralLighter,
  },
  sidebar: {
    width: '300px',
    borderRight: `1px solid ${theme.palette.neutralLight}`,
    display: 'flex',
    flexDirection: 'column',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  messageContainer: {
    padding: '20px',
  },
  message: {
    marginBottom: '16px',
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.palette.themeLighter,
    padding: '10px',
    borderRadius: '8px 8px 0 8px',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.palette.neutralLighter,
    padding: '10px',
    borderRadius: '8px 8px 8px 0',
  },
  inputContainer: {
    padding: '20px',
    borderTop: `1px solid ${theme.palette.neutralLight}`,
  },
})

const stackTokens: IStackTokens = {
  childrenGap: 10,
}

const scrollablePaneStyles: Partial<IScrollablePaneStyles> = {
  root: {
    height: '100%',
  },
  stickyAbove: {
    backgroundColor: theme.palette.white,
  },
  stickyBelow: {
    backgroundColor: theme.palette.white,
  },
}


export default function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollablePane = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages')
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages.slice(-10)))
  }, [messages])

  useEffect(() => {
    if (scrollablePane.current) {
      scrollablePane.current.scrollTop = scrollablePane.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      question: inputValue,
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Simulating an API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      const answer = `This is a simulated answer to: "${inputValue}"`
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, answer } : msg
        )
      )
    } catch (error) {
      console.error('Error fetching answer:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuestionClick = (id: string) => {
    const element = document.getElementById(`message-${id}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <div className={classNames.container}>
        <div className={classNames.sidebar}>
          <Stack tokens={stackTokens} styles={{ root: { padding: '20px' } }}>
            <Text variant="xLarge" block>Chat App v3</Text>
            <PrimaryButton iconProps={{ iconName: 'Add' }} text="New Chat" />
            <SearchBox placeholder="Search chats" />
          </Stack>
          <ScrollablePane styles={scrollablePaneStyles}>
            <Stack tokens={stackTokens} styles={{ root: { padding: '0 20px' } }}>
              {messages.slice(-10).reverse().map((msg) => (
                <DefaultButton
                  key={msg.id}
                  text={msg.question}
                  onClick={() => handleQuestionClick(msg.id)}
                  styles={{
                    root: {
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                    },
                  }}
                />
              ))}
            </Stack>
          </ScrollablePane>
        </div>
        <div className={classNames.chatArea}>
          <Stack horizontal verticalAlign="center" styles={{ root: { padding: '10px 20px', borderBottom: `1px solid ${theme.palette.neutralLight}` } }}>
            <Persona
              imageUrl="/placeholder-avatar.jpg"
              text="AI Assistant"
              secondaryText="Always here to help"
              size={PersonaSize.size40}
            />
            <Stack.Item grow>
              <span />
            </Stack.Item>
            <IconButton iconProps={{ iconName: 'MoreVertical' }} title="More options" ariaLabel="More options" />
          </Stack>
          <ScrollablePane styles={scrollablePaneStyles} componentRef={scrollablePane}>
            <Stack tokens={stackTokens} className={classNames.messageContainer}>
              {messages.map((msg) => (
                <Stack key={msg.id} id={`message-${msg.id}`} tokens={stackTokens}>
                  <Stack horizontal tokens={stackTokens}>
                    <Persona
                      imageUrl="/placeholder-user.jpg"
                      size={PersonaSize.size32}
                      styles={{ root: { alignSelf: 'flex-start' } }}
                    />
                    <Text className={`${classNames.message} ${classNames.userMessage}`}>{msg.question}</Text>
                  </Stack>
                  {msg.answer && (
                    <Stack horizontal tokens={stackTokens}>
                      <Persona
                        imageUrl="/placeholder-avatar.jpg"
                        size={PersonaSize.size32}
                        styles={{ root: { alignSelf: 'flex-start' } }}
                      />
                      <Text className={`${classNames.message} ${classNames.aiMessage}`}>{msg.answer}</Text>
                    </Stack>
                  )}
                </Stack>
              ))}
            </Stack>
          </ScrollablePane>
          <form onSubmit={handleSubmit}>
            <Stack horizontal tokens={stackTokens} className={classNames.inputContainer}>
              <Stack.Item grow>
                <TextField
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(_, newValue) => setInputValue(newValue || '')}
                  disabled={isLoading}
                />
              </Stack.Item>
              <PrimaryButton type="submit" disabled={isLoading} iconProps={{ iconName: 'Send' }}>
                {isLoading ? <Spinner size={SpinnerSize.small} /> : 'Send'}
              </PrimaryButton>
            </Stack>
          </form>
        </div>
      </div>
    </ThemeProvider>
  )
}
*/
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


  const fetchStreamResponse = async (path: string, authToken: string, method: string, body: string | undefined) => {
    try {
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
  
      if (!response.body) {
        throw new Error("ReadableStream not supported in this browser.");
      }

      const reader = response.body.getReader(); // Get a stream reader
      const decoder = new TextDecoder('utf-8'); // Text decoder for UTF-8

      const stream = new ReadableStream({
        async start(controller) {
          while (true) {
            const { done, value } = await reader.read(); // Read each chunk
            if (done) {
              console.log("Stream complete");
              break; // End the loop when the stream is complete
            }
            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(chunk); // Push the chunk to the ReadableStream

            const formattedChunk = chunk
              .replace(/\\n\\n/g, '\n\n') // Replace double escaped line breaks with actual line breaks
              .replace(/\\n/g, '\n')      // Replace single escaped line breaks with a space
              .replace(/^\s*\-\s+/gm, '- ') // Ensure proper spacing for bullet points
              .replace(/^(#+)\s+/gm, '$1 ') // Ensure there's a space after the hashtag in headings

            setOutputValue((prev) => prev + formattedChunk); // Update state with new chunk
          }
          controller.close(); // Close the stream
        }
      });

      // Pipe the stream to the console (or you can handle it differently)
      const readerStream = stream.getReader();
      while (true) {
        const { done, value } = await readerStream.read();
        if (done) break;
        console.log(value);
      }

    } catch (error) {
      console.error("Error fetching the stream:", error);
      setError("Error fetching the stream.");
    }
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

  /*
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
*/
  const handleStreamingButtonClick = async () => {
    if (!token) {
      throw new Error("Invalid token")
    }
    setSubmitting(true)
    setOutputValue("")
    await fetchStreamResponse(`${process.env.NEXT_PUBLIC_CLOUD_FUNCTION_PATH}`, token, 'POST', inputValue);
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
    <Stack tokens={{ childrenGap: 15 }} styles={{ root: { maxWidth: 1500, margin: '0 auto', padding: 20,  } }}>
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
      
      <PrimaryButton disabled={submitting || !inputValue} onClick={handleStreamingButtonClick} styles={{ root: { alignSelf: 'flex-start' } }}>
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
