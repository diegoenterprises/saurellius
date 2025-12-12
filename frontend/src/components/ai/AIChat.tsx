/**
 * SAURELLIUS AI CHAT
 * Floating AI assistant chatbot - Your intelligent payroll partner
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors, spacing, borderRadius, fontSize } from '../../styles/theme';
import { aiService, ChatContext } from '../../services/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  context?: ChatContext;
  onClose?: () => void;
}

export default function AIChat({ context, onClose }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm Saurellius AI, your intelligent payroll partner. I can help you with:\n\n- Payroll calculations and questions\n- Tax withholding explanations\n- State compliance requirements\n- Paystub generation\n\nWhat can I help you with today?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fabScale = useRef(new Animated.Value(1)).current;

  // Quick action suggestions
  const quickActions = [
    { label: 'How to fill W-4?', topic: 'w4' },
    { label: 'Explain overtime', topic: 'overtime' },
    { label: 'Tax deductions', topic: 'deductions' },
    { label: 'I-9 requirements', topic: 'i9' },
  ];

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await aiService.chat(inputText.trim(), context);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (topic: string) => {
    setIsLoading(true);
    try {
      const response = await aiService.quickHelp(topic);
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Quick action error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#1473FF', '#BE01FF']}
              style={styles.avatar}
            >
              <Ionicons name="sparkles" size={14} color="#fff" />
            </LinearGradient>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fab,
          { transform: [{ scale: fabScale }] },
        ]}
      >
        <TouchableOpacity onPress={toggleChat} activeOpacity={0.8}>
          <LinearGradient
            colors={['#1473FF', '#BE01FF']}
            style={styles.fabGradient}
          >
            <Ionicons
              name={isOpen ? 'close' : 'chatbubble-ellipses'}
              size={24}
              color="#fff"
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView intensity={20} style={styles.blurView}>
            <View style={styles.chatContainer}>
              {/* Header */}
              <LinearGradient
                colors={['#1473FF', '#BE01FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
              >
                <View style={styles.headerContent}>
                  <View style={styles.headerLeft}>
                    <Ionicons name="sparkles" size={20} color="#fff" />
                    <Text style={styles.headerTitle}>Saurellius AI</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsOpen(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="chevron-down" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              {/* Messages */}
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.messagesContainer}
              >
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.messagesList}
                  contentContainerStyle={styles.messagesContent}
                  showsVerticalScrollIndicator={false}
                >
                  {messages.map(renderMessage)}
                  
                  {isLoading && (
                    <View style={styles.loadingContainer}>
                      <View style={styles.loadingBubble}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.loadingText}>Thinking...</Text>
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* Quick Actions */}
                {messages.length <= 2 && (
                  <View style={styles.quickActions}>
                    <Text style={styles.quickActionsTitle}>Quick questions:</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.quickActionsScroll}
                    >
                      {quickActions.map((action, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.quickActionButton}
                          onPress={() => handleQuickAction(action.topic)}
                          disabled={isLoading}
                        >
                          <Text style={styles.quickActionText}>{action.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ask me anything about payroll..."
                    placeholderTextColor={colors.textMuted}
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity
                    onPress={handleSend}
                    disabled={!inputText.trim() || isLoading}
                    style={[
                      styles.sendButton,
                      (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                    ]}
                  >
                    <LinearGradient
                      colors={
                        inputText.trim() && !isLoading
                          ? ['#1473FF', '#BE01FF']
                          : ['#444', '#333']
                      }
                      style={styles.sendButtonGradient}
                    >
                      <Ionicons name="send" size={18} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          </BlurView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1473FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chatContainer: {
    height: '85%',
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    overflow: 'hidden',
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  closeButton: {
    padding: spacing.xs,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: spacing.sm,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
  },
  quickActions: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  quickActionsTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  quickActionsScroll: {
    gap: spacing.sm,
  },
  quickActionButton: {
    backgroundColor: colors.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  quickActionText: {
    color: colors.text,
    fontSize: fontSize.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.md,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendButton: {
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
