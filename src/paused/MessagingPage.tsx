// client/src/pages/MessagingPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import styles from './MessagingPage.module.css';

// Icône Retour (simple SVG pour l'exemple)
const BackArrowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

interface UserConversation {
  conversation_id: string;
  other_user_id: string;
  other_username: string | null;
  other_profile_picture_url: string | null;
  last_message_content: string | null;
  last_message_created_at: string | null;
  last_message_sender_id: string | null;
  conversation_updated_at: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_username?: string;
}

const MessagingPage: React.FC = () => {
  const { user: currentUser, session } = useAuth();
  const navigate = useNavigate();
  const { targetUserId: targetUserIdFromParams, conversationId: conversationIdFromParams } = useParams<{ targetUserId?: string, conversationId?: string }>();

  const [conversations, setConversations] = useState<UserConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<UserConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageContent, setNewMessageContent] = useState('');
  
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [initializingConversation, setInitializingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 850); 

  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const textareaRef = useRef<null | HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkMobileView = () => setIsMobileView(window.innerWidth <= 850);
    window.addEventListener('resize', checkMobileView);
    checkMobileView();
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!currentUser || !conversationId) return;
    try {
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id);
    } catch (err) {
      console.error("Exception lors du marquage comme lu:", err);
    }
  }, [currentUser]);

  const fetchConversations = useCallback(async (selectConvIdAfterFetch?: string) => {
    if (!currentUser) return;
    setLoadingConversations(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_user_conversations');
      if (rpcError) throw rpcError;
      if (data) {
        const fetchedConversations = (data as UserConversation[]).sort((a,b) => new Date(b.conversation_updated_at!).getTime() - new Date(a.conversation_updated_at!).getTime());
        setConversations(fetchedConversations);
        
        let conversationToSelect = null;
        if (selectConvIdAfterFetch) {
            conversationToSelect = fetchedConversations.find(c => c.conversation_id === selectConvIdAfterFetch) || null;
        } else if (conversationIdFromParams && !isMobileView) { 
            conversationToSelect = fetchedConversations.find(c => c.conversation_id === conversationIdFromParams) || null;
        }
        
        if (conversationToSelect) {
            setSelectedConversation(conversationToSelect);
        }
      } else {
        setConversations([]);
      }
    } catch (err: any) {
      console.error("Erreur fetchConversations:", err);
      setError(prev => prev ? `${prev}\n${err.message}` : err.message || "Impossible de charger les conversations.");
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  }, [currentUser, conversationIdFromParams, isMobileView]); // Retiré selectedConversation pour éviter boucle potentielle si fetchConversations le modifie


  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!conversationId || !currentUser) return;
    setLoadingMessages(true);
    setError(null); 
    try {
      const { data, error: messagesError } = await supabase
        .from('messages')
        .select(`id, conversation_id, sender_id, content, created_at, senderProfile:sender_id ( username )`)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      
      setMessages(data ? data.map(msg => ({ ...msg, sender_username: (msg as any).senderProfile?.username || 'Utilisateur' })) as Message[] : []);
      markConversationAsRead(conversationId); 
    } catch (err: any) { // Correction ici avec les accolades
      console.error("Erreur fetchMessages:", err);
      setError(err.message || "Impossible de charger les messages.");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUser, markConversationAsRead]);

  useEffect(() => {
    if (currentUser && session) {
      fetchConversations();
    } else if (!session && !currentUser && !loadingConversations) { 
        navigate('/login?redirect=/messagerie');
    }
  }, [currentUser, session, fetchConversations, navigate, loadingConversations]);

  useEffect(() => {
    const initializeConversation = async () => {
      if (targetUserIdFromParams && currentUser && !loadingConversations) {
        setInitializingConversation(true);
        setError(null);
        try {
          const { data: convData, error: createConvError } = await supabase.rpc('create_or_get_conversation', {
            p_recipient_id: targetUserIdFromParams
          });

          if (createConvError) throw createConvError;

          if (convData && convData.length > 0 && convData[0].conversation_id) {
            const newConvId = convData[0].conversation_id;
            // Recharger les conversations et fetchConversations s'occupera de sélectionner si newConvId est passé
            await fetchConversations(newConvId); 
            navigate('/messagerie', { replace: true }); 
          } else {
            setError("Impossible de créer ou trouver la conversation via RPC.");
          }
        } catch (err: any) {
          console.error("Erreur initializeConversation:", err);
          setError(err.message || "Erreur lors de l'initialisation.");
        } finally {
          setInitializingConversation(false);
        }
      }
    };

    // Exécuter seulement si targetUserId est là et qu'on ne vient pas d'une URL avec un ID de conversation explicite
    if (targetUserIdFromParams && !conversationIdFromParams) {
        initializeConversation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserIdFromParams, currentUser, loadingConversations, navigate, fetchConversations, conversationIdFromParams]); 
  
  useEffect(() => {
    if (selectedConversation?.conversation_id) {
      fetchMessages(selectedConversation.conversation_id);
    } else {
      setMessages([]);
    }
  }, [selectedConversation, fetchMessages]);

  useEffect(() => {
    if (messages.length) messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);
  
  useEffect(() => {
    if (!selectedConversation?.conversation_id || !supabase || !currentUser) return;

    const channel = supabase
      .channel(`messages-conv-${selectedConversation.conversation_id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversation.conversation_id}` },
        async (payload) => {
          const newMessageFromPayload = payload.new as Omit<Message, 'sender_username'>;
          let senderUsername = 'Utilisateur';
          if (newMessageFromPayload.sender_id) {
              try {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', newMessageFromPayload.sender_id)
                    .single();
                if (profileData) senderUsername = profileData.username || 'Utilisateur';
              } catch (profileError) {
                console.error("Erreur fetch profil pour message RT:", profileError)
              }
          }
          const fullNewMessage: Message = { ...newMessageFromPayload, sender_username: senderUsername };
          setMessages((prevMessages) => {
            if (prevMessages.find(msg => msg.id === fullNewMessage.id)) return prevMessages;
            return [...prevMessages, fullNewMessage];
          });
          if (newMessageFromPayload.sender_id !== currentUser.id) {
            markConversationAsRead(selectedConversation.conversation_id);
          }
          setConversations(prevConvs => 
            prevConvs.map(conv => 
              conv.conversation_id === selectedConversation.conversation_id 
              ? { ...conv, 
                  last_message_content: fullNewMessage.content, 
                  last_message_created_at: fullNewMessage.created_at,
                  conversation_updated_at: fullNewMessage.created_at,
                  last_message_sender_id: fullNewMessage.sender_id
                } 
              : conv
            ).sort((a,b) => new Date(b.conversation_updated_at!).getTime() - new Date(a.conversation_updated_at!).getTime())
          );
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') console.log(`RT SUBSCRIBED: ${selectedConversation.conversation_id}`);
        else if (err) console.error(`RT ERREUR: ${selectedConversation.conversation_id}`, err);
      });
    return () => {
      if (selectedConversation?.conversation_id) {
        supabase.removeChannel(channel).catch(err => console.error("Erreur removeChannel", err));
      }
    };
  }, [selectedConversation, supabase, currentUser, markConversationAsRead]);

  const handleSelectConversation = (conversation: UserConversation) => {
    setSelectedConversation(conversation);
    if (!isMobileView && targetUserIdFromParams) { 
      navigate('/messagerie', { replace: true }); 
    }
  };
  
  const handleBackToListMobile = () => {
    setSelectedConversation(null);
  };

  const submitForm = async () => {
    if (!newMessageContent.trim() || !selectedConversation || !currentUser) return;
    const tempId = `temp-${Date.now()}-${Math.random()}`; 
    const contentToSend = newMessageContent.trim();
    const optimisticMessage: Message = {
      id: tempId, conversation_id: selectedConversation.conversation_id,
      sender_id: currentUser.id, content: contentToSend,
      created_at: new Date().toISOString(),
      sender_username: currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'Moi',
    };
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    setNewMessageContent(''); 
    setSendingMessage(true); setError(null); 
    setConversations(prevConvs => 
      prevConvs.map(conv => 
        conv.conversation_id === selectedConversation.conversation_id 
        ? { ...conv, 
            last_message_content: contentToSend,
            last_message_created_at: optimisticMessage.created_at,
            conversation_updated_at: optimisticMessage.created_at,
            last_message_sender_id: currentUser.id
          } 
        : conv
      ).sort((a,b) => new Date(b.conversation_updated_at!).getTime() - new Date(a.conversation_updated_at!).getTime())
    );
    try {
      const messageToInsert = {
        conversation_id: selectedConversation.conversation_id,
        sender_id: currentUser.id, content: contentToSend,
      };
      const { data: insertedData, error: insertError } = await supabase
        .from('messages').insert(messageToInsert).select().single(); 
      if (insertError) throw insertError;
      if (insertedData) {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempId 
            ? { ...insertedData, sender_username: optimisticMessage.sender_username } as Message 
            : msg
          )
        );
      } else {
        console.warn("Message inséré mais pas de données retournées.");
      }
    } catch (err: any) {
      console.error("Erreur handleSendMessage:", err);
      setError(err.message || "Impossible d'envoyer.");
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempId));
    } finally {
      setSendingMessage(false);
      textareaRef.current?.focus();
    }
  };
  const handleFormSubmitEvent = (e: React.FormEvent) => { e.preventDefault(); submitForm(); };
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitForm(); }};
  useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; const scrollHeight = textareaRef.current.scrollHeight; const maxHeight = 100; textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`; } }, [newMessageContent]);
  const formatDate = (dateString: string | null | undefined) => { if (!dateString) return ''; const date = new Date(dateString); return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year:'2-digit' }) + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); };

  if (!currentUser && !session && !loadingConversations) {
    return <div className={styles.pageStateContainer}><p>Veuillez vous <Link to="/login?redirect=/messagerie">connecter</Link> pour accéder à la messagerie.</p></div>;
  }

  const showConversationList = !isMobileView || (isMobileView && !selectedConversation);
  const showChatArea = !isMobileView || (isMobileView && selectedConversation);

  return (
    <div className={`${styles.messagingPageContainer} ${isMobileView ? styles.mobileLayoutActive : ''}`}>
      {showConversationList && (
        <div className={`${styles.sidebar} ${isMobileView && !selectedConversation ? styles.fullViewMobile : ''}`}>
          <h2 className={styles.sidebarTitle}>Discussions</h2>
          {loadingConversations && conversations.length === 0 && <p className={styles.loadingState}>Chargement...</p>}
          {!loadingConversations && conversations.length === 0 && !error && <p className={styles.emptyState}>Aucune discussion.</p>}
          {error && conversations.length === 0 && !loadingConversations && <p className={`${styles.errorMessageSmall} ${styles.centeredError}`}>{error}</p>}
          <ul className={styles.conversationList}>
            {conversations.map((conv) => (
              <li
                key={conv.conversation_id}
                className={`${styles.conversationItem} ${selectedConversation?.conversation_id === conv.conversation_id ? styles.selected : ''}`}
                onClick={() => handleSelectConversation(conv)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectConversation(conv)}
              >
                <img 
                  src={conv.other_profile_picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${conv.other_username || 'U'}`} 
                  alt={conv.other_username || ''} 
                  className={styles.conversationAvatar} 
                />
                <div className={styles.conversationInfo}>
                  <span className={styles.conversationUser}>{conv.other_username || 'Utilisateur Inconnu'}</span>
                  <span className={styles.conversationLastMessage}>
                    {conv.last_message_sender_id === currentUser?.id ? <span className={styles.messageYouPrefix}>Vous: </span> : ''}
                    {conv.last_message_content ? (conv.last_message_content.substring(0, 22) + (conv.last_message_content.length > 22 ? '...' : '')) : <span className={styles.italicPlaceholder}>Pas de messages</span>}
                  </span>
                </div>
                {(conv.last_message_created_at || conv.conversation_updated_at) && 
                  <span className={styles.conversationTimestamp}>
                    {formatDate(conv.last_message_created_at || conv.conversation_updated_at)}
                  </span>
                }
              </li>
            ))}
          </ul>
        </div>
      )}

      {showChatArea && (
        <div className={`${styles.chatArea} ${isMobileView && selectedConversation ? styles.fullViewMobile : ''}`}>
          {selectedConversation ? (
            <>
              <header className={styles.chatHeader}>
                {isMobileView && (
                  <button onClick={handleBackToListMobile} className={styles.backButtonMobile}>
                    <BackArrowIcon />
                  </button>
                )}
                <h3>{selectedConversation.other_username || 'Utilisateur Inconnu'}</h3>
                {selectedConversation.other_username && (
                    <Link to={`/profil/${selectedConversation.other_username}`} className={styles.profileLinkInChat}>
                      Voir profil
                    </Link>
                )}
              </header>
              <div className={styles.messagesContainer}>
                {loadingMessages && <p className={styles.loadingState}>Chargement des messages...</p>}
                {error && !loadingMessages && messages.length === 0 && <p className={styles.errorMessageSmall}>{error}</p>}
                {!loadingMessages && messages.map((msg) => (
                  <div
                    key={msg.id} 
                    className={`${styles.messageItem} ${msg.sender_id === currentUser?.id ? styles.sent : styles.received}`}
                  >
                    <div className={styles.messageBubble}>
                      {msg.sender_id !== currentUser?.id && selectedConversation && (
                          <img 
                              src={selectedConversation.other_profile_picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${selectedConversation.other_username || 'U'}`} 
                              alt="avatar interlocuteur" 
                              className={styles.messageAvatar} 
                          />
                      )}
                      <div className={styles.messageTextAndTimestamp}>
                        <p className={styles.messageContent}>{msg.content}</p>
                        <span className={styles.messageTimestamp}>{formatDate(msg.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleFormSubmitEvent} className={styles.messageForm}>
                <textarea 
                  ref={textareaRef} 
                  value={newMessageContent} 
                  onChange={(e) => setNewMessageContent(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Écrivez votre message..."
                  className={styles.messageInput}
                  rows={1} 
                  disabled={sendingMessage || loadingMessages || initializingConversation}
                />
                <button 
                  type="submit" 
                  className={styles.sendMessageButtonInForm} 
                  disabled={sendingMessage || !newMessageContent.trim() || initializingConversation}
                >
                  {sendingMessage ? 'Envoi...' : 'Envoyer'}
                </button>
              </form>
            </>
          ) : (
            !isMobileView && <div className={styles.noConversationSelected}><p>Sélectionnez une discussion.</p></div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessagingPage;