import {
  Box,
  Button,
  Container,
  HStack,
  Input,
  VStack,
} from "@chakra-ui/react";
import Message from "./Components/Message";
import {
  onAuthStateChanged,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { app } from "./firebase";
import { useEffect, useRef, useState } from "react";

import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

const auth = getAuth(app);

const DB = getFirestore(app);

const logoutHandler = () => {
  signOut(auth);
};

const loginHandler = () => {
  const provider = new GoogleAuthProvider();

  signInWithPopup(auth, provider);
};

const App = () => {
  const [user, setUser] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const divForScroll = useRef();

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      setMessage("");
      await addDoc(collection(DB, "Messages"), {
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        creatAt: serverTimestamp(),
      });
      
      divForScroll.current.scrollIntoView({ behavior: "smooth"});
    } catch (error) {
      alert(error);
      console.log(error.message);
    }
  };

  useEffect(() => {
    const q = query(collection(DB, "Messages"), orderBy("creatAt", "asc"));

    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setUser(data);
    });

    const unsubscribeForMessage = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((item) => {
          const id = item.id;
          return { id, ...item.data() };
        })
      );
    });
    return () => {
      unsubscribe();
      unsubscribeForMessage();
    };
  }, []);

  return (
    <Box bg={"red.50"}>
      {user ? (
        <Container bg={"white"} h={"100vh"}>
          <VStack h="full" paddingY={"4"}>
            <Button w={"full"} bg={"red"} onClick={logoutHandler}>Logout</Button>
            <VStack  overflowY={"auto"} w={"full"} h={"full"} css={{"&::-webkit-scrollbar":{display:"none"}}}>
              {messages.map((item) => (
                <Message
                  key={item.id}
                  user={item.uid === user.uid ? "me" : "other"}
                  text={item.text}
                  uri={item.uri}
                />
              ))}
              <div ref={divForScroll}></div>
            </VStack>

            <form onSubmit={submitHandler} style={{ width: "100%" }}>
              <HStack>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="enter messgae"
                />
                <Button colorScheme="purple" type="submit">
                  Send
                </Button>
              </HStack>
            </form>
          </VStack>
        </Container>
      ) : (
        <VStack bg={"white"} justifyContent={"Center"} h={"100vh"}>
          <Button onClick={loginHandler} colorScheme={"purple"}>
            Sign In With Google
          </Button>
        </VStack>
      )}
    </Box>
  );
};

export default App;
