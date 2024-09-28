"use client";
import ReactMarkdown from 'react-markdown';
import React, { useState, useEffect, useRef } from 'react'

import {
  initializeIcons,
  ThemeProvider,
  createTheme,
  ITheme,
  Stack,
  IStackTokens,
  TextField,
  PrimaryButton,
  Spinner,
  SpinnerSize,
  mergeStyleSets,
  Persona,
  PersonaSize,
  IButtonStyles,
  Icon,
} from '@fluentui/react'

initializeIcons()

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
    backgroundColor: theme.palette.black,
  },
  sidebar: {
    width: '300px',
    maxWidth: '300px',
    borderRight: `1px solid ${theme.palette.neutralLight}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    color: theme.palette.white
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
    padding: '10px',
    borderRadius: '8px 8px 0 8px',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    padding: '10px',
    borderRadius: '8px 8px 8px 0',
  },
  inputContainer: {
    padding: '20px',
    borderTop: `1px solid ${theme.palette.neutralLight}`,
  },
  headerText: {
    fontSize: theme.fonts.xLarge.fontSize,
    fontWeight: theme.fonts.xLarge.fontWeight,
    color: "#08fe6d",
    padding: '20px',
  },
  customCoinClass: {
    selectors: {
      '& .ms-Persona-initials': {
        backgroundColor: '#08fe6d', // Explicit coin background color
        color: '#000000', // Explicit coin text color
      },
    }
  },
  leftBarButton: {
        textAlign: 'left',
        justifyContent: 'flex-start',
        borderRadius: '5px'
  },
  spinner: {
    borderTop : '8px solid blue',  /* Spinner color */
  },
  spinnerContainer: {
    backgroundColor: "#08fe6d" /* Background color */
  }
})

const stackTokens: IStackTokens = {
  childrenGap: 10,
}

const customButtonStyles: IButtonStyles = {
  root: {
    borderColor: "#08fe6d",
    color: theme.palette.white,
    backgroundColor: theme.palette.black
  },
  rootHovered: {
    borderColor: "#08fe6d",
    backgroundColor: '#222222',
  },
  rootPressed: {
    borderColor: "#08fe6d",
    backgroundColor: theme.palette.black,
  },
  rootDisabled: {
    borderColor: "#08fe6d",
    backgroundColor: theme.palette.black,
  }
}



export default function ChatApp() {
  const [token, setToken] = useState<string|undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

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
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      throw new Error("bad token")
    }
    if (!inputValue.trim() || submitting) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      question: inputValue,
    }

    setMessages(prevMessages => [...prevMessages, newMessage])
    setInputValue('')
    setSubmitting(true)

    try {
      const response = await makeFunctionCall(`${process.env.NEXT_PUBLIC_CLOUD_FUNCTION_PATH}`, token, 'POST', inputValue);
      const trimmedText = response.replace(/^["']|["']$/g, '').trim();
      const answer = trimmedText
        .replace(/\\n\\n/g, '\n\n') // Replace double escaped line breaks with actual line breaks
        .replace(/\\n/g, '\n')      // Replace single escaped line breaks with a space
        .replace(/^\s*\-\s+/gm, '- ') // Ensure proper spacing for bullet points
        .replace(/^(#+)\s+/gm, '$1 ') // Ensure there's a space after the hashtag in headings
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === newMessage.id ? { ...msg, answer } : msg
        )
      )
    } catch (error) {
      console.error('Error fetching answer:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuestionClick = (id: string) => {
    const element = document.getElementById(`message-${id}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

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
    <ThemeProvider theme={theme}>
      <div className={classNames.container}>
        {loadingElement}
        {errorElement}
        <div className={classNames.sidebar}>
          <Stack >
            <span className={classNames.headerText}>Book Reviews</span>
              <Stack tokens={stackTokens} styles={{ root: { padding: '0 20px', maxWidth: '300px' } }}>
                {messages.slice(-10).reverse().map((msg) => (
                  <PrimaryButton
                    key={msg.id}
                    text={`${msg.question.substring(0, 30)} ...`}
                    onClick={() => handleQuestionClick(msg.id)}
                    className={classNames.leftBarButton}
                    styles={customButtonStyles}
                  />
                ))}
              </Stack>
          </Stack>
        </div>
        <div className={classNames.chatArea}>
          <Stack horizontal verticalAlign="center" styles={{ root: { padding: '10px 20px', borderBottom: `1px solid ${theme.palette.neutralLight}` } }}>
            <Persona
              styles={{
                primaryText: {
                  color: theme.palette.white
                },
                secondaryText: {
                  color: theme.palette.white
                }
              }}
              className={classNames.customCoinClass}
              text="Book review bot"
              secondaryText="Get started with your reading journey!"
              size={PersonaSize.size40}
            />
          </Stack>
          <div ref={chatContainerRef} style={{ overflowY: 'auto', height: '100%', padding: '20px' }}>
            <Stack tokens={stackTokens}>
              {messages.map((msg) => (
                <Stack key={msg.id} id={`message-${msg.id}`} tokens={stackTokens}>
                  <Stack horizontal tokens={stackTokens} horizontalAlign="end">
                  <span className={`${classNames.message} ${classNames.userMessage}`}>{msg.question}</span>
                  <Persona
                      size={PersonaSize.size32}
                      className={classNames.customCoinClass}
                      styles={{ root: { alignSelf: 'flex-start' } }}
                    />
                  </Stack>
                  {msg.answer && (
                    <Stack horizontal tokens={stackTokens}>
                      <Persona
                        className={classNames.customCoinClass}
                        imageInitials='BB'
                        size={PersonaSize.size32}
                        styles={{ root: { alignSelf: 'flex-start' } }}
                      />
                      <span className={`${classNames.message} ${classNames.aiMessage}`}>
                      <ReactMarkdown> 
                        {msg.answer} 
                      </ReactMarkdown>
                      </span>
                    </Stack>
                  )}
                </Stack>
              ))}
            </Stack>
          </div>
          <form onSubmit={handleSubmit}>
            <Stack horizontal tokens={stackTokens} className={classNames.inputContainer}>
              <Stack.Item grow>
                <TextField
                  styles={{
                    field: {
                      backgroundColor: '#000000',
                      color: '#ffffff',
                    },
                    fieldGroup: {
                      borderColor: "#08fe6d",
                      transition: 'border-color 0.1s ease-in-out',
                      selectors: {
                        ':hover': {
                          borderColor: '#06cb57', // Hover state: slightly darker green
                        },
                        ':focus-within': {
                          borderColor: '#0aff8c', // Focus state: slightly lighter green
                        },
                        ':after': {
                          borderColor: "#08fe6d",
                        },
                      },
                    },
                  }}
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(_, newValue) => setInputValue(newValue || '')}
                  disabled={submitting}
                />
              </Stack.Item>
              <PrimaryButton
              styles={customButtonStyles}
                type="submit" disabled={submitting}>
                {submitting ?
                      <Spinner size={SpinnerSize.small}/> :
                      <Icon iconName="Send"/>
                    }
              </PrimaryButton>
            </Stack>
          </form>
        </div>
      </div>
    </ThemeProvider>
  )
}

/*
export default function ChatApp() {
  const [token, setToken] = useState<string|undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const scrollablePaneRef = useRef<HTMLDivElement>(null)



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      throw new Error("bad token")
    }
    if (!inputValue.trim() || submitting) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      question: inputValue,
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    setSubmitting(true)

    try {

    const response = await makeFunctionCall(`${process.env.NEXT_PUBLIC_CLOUD_FUNCTION_PATH}`, token, 'POST', inputValue);
    const trimmedText = response.replace(/^["']|["']$/g, '').trim();
    const formattedText = trimmedText
      .replace(/\\n\\n/g, '\n\n') // Replace double escaped line breaks with actual line breaks
      .replace(/\\n/g, '\n')      // Replace single escaped line breaks with a space
      .replace(/^\s*\-\s+/gm, '- ') // Ensure proper spacing for bullet points
      .replace(/^(#+)\s+/gm, '$1 ') // Ensure there's a space after the hashtag in headings

      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, formattedText } : msg
        )
      )
    } catch (error) {
      console.error('Error fetching answer:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuestionClick = (id: string) => {
    const element = document.getElementById(`message-${id}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

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
    <ThemeProvider theme={theme}>
      <div className={classNames.container}>
      {loadingElement}
      {errorElement}

        <div className={classNames.sidebar}>
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
          <div ref={scrollablePaneRef} style={{ overflowY: 'auto', height: '100%' }}>
            <ScrollablePane styles={scrollablePaneStyles}>
              <Stack tokens={stackTokens} className={classNames.messageContainer}>
                {messages.map((msg) => (
                  <Stack key={msg.id} id={`message-${msg.id}`} tokens={stackTokens}>
                    <Stack horizontal tokens={stackTokens}>
                      <Persona
                        imageUrl="/placeholder-user.jpg"
                        size={PersonaSize.size32}
                        styles={{ root: { alignSelf: 'flex-start' } }}
                      />
                      <span className={`${classNames.message} ${classNames.userMessage}`}>{msg.question}</span>
                    </Stack>
                    {msg.answer && (
                      <Stack horizontal tokens={stackTokens}>
                        <Persona
                          imageUrl="/placeholder-avatar.jpg"
                          size={PersonaSize.size32}
                          styles={{ root: { alignSelf: 'flex-start' } }}
                        />
                        <span className={`${classNames.message} ${classNames.aiMessage}`}>{msg.answer}</span>
                      </Stack>
                    )}
                  </Stack>
                ))}
              </Stack>
            </ScrollablePane>
          </div>
          <form onSubmit={handleSubmit}>
            <Stack horizontal tokens={stackTokens} className={classNames.inputContainer}>
              <Stack.Item grow>
                <TextField
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(_, newValue) => setInputValue(newValue || '')}
                  disabled={submitting}
                />
              </Stack.Item>
              <PrimaryButton type="submit" disabled={submitting} iconProps={{ iconName: 'Send' }}>
                {submitting ? <Spinner size={SpinnerSize.small} /> : 'Send'}
              </PrimaryButton>
            </Stack>
          </form>
        </div>
      </div>
    </ThemeProvider>
  )
}


  /*
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
  */

/*
  const handleStreamingButtonClick = async () => {
    if (!token) {
      throw new Error("Invalid token")
    }
    setSubmitting(true)
    setOutputValue("")
    await fetchStreamResponse(`${process.env.NEXT_PUBLIC_CLOUD_FUNCTION_PATH}`, token, 'POST', inputValue);
    setSubmitting(false)
  };
*/


