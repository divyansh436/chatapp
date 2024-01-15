import { Box,Button,Container,HStack,Input,VStack } from "@chakra-ui/react";
import Message from "./components/Message";
import { useEffect, useRef, useState } from "react";
import { app } from "./firebase";
import {onAuthStateChanged, getAuth, GoogleAuthProvider, signInWithPopup , signOut} from "firebase/auth";
import { getFirestore,addDoc, collection, serverTimestamp , onSnapshot , query, orderBy} from "firebase/firestore";

const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler = ()=>{
  const provider = new GoogleAuthProvider();

  signInWithPopup(auth,provider);
}


const logoutHandler = ()=> signOut(auth);

function App() {

  
  const [user,setUser] = useState(false);
  const [message,setMessage] = useState("");
  const [messages,setMessages] = useState([]);
  const divForscroll = useRef(null);

  const submitHandler = async(e)=>{
    e.preventDefault();
  
    try {
      await addDoc(collection(db,"Messages"),{
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp(),
      });

      setMessage("");
      divForscroll.current.scrollIntoView({behaviour:"smooth"});
    } catch (error) {
      alert(error)
    }
  }

  useEffect(()=>{
    const q = query(collection(db,"Messages"), orderBy("createdAt","asc"));

    const unsubscribe = onAuthStateChanged(auth,(data)=>{
      setUser(data);
    });

    const unsubscribeFormessage = onSnapshot(q,(snap)=>{
      setMessages(
        snap.docs.map((item)=>{
          const id =item.id;
          return {id, ...item.data()}
        })
      )
    });

    return ()=>{
      unsubscribe();
      unsubscribeFormessage();
    }
  },[]);

  return (
    <Box bg={"gray.50"}>
      {
      user?(<Container h={"100vh"} bg={"red.50"}>
        <VStack h={"full"} paddingY={"4"}>
          <Button onClick={logoutHandler} colorScheme="red" w={"full"}>Sign Out</Button>

          <VStack h={"full"} w={"full"} overflowY={"auto"} css={{"&::-webkit-scrollbar":{display:"none"}}}>
            {
              messages.map((item)=>(
                <Message key={item.id} user={item.uid===user.uid?"me":"other"} text={item.text} uri={item.uri} />
              ))
            }  
            <div ref={divForscroll}></div>
          </VStack>

            
          <form value={message} onChange={(e)=>setMessage(e.target.value)} onSubmit={submitHandler} style={{ width: "100%"}}>
            <HStack>
              <Input placeholder="Enter a Message...."/>
              <Button colorScheme="blue" type="submit">Send</Button>
            </HStack>
          </form>
        </VStack>
      </Container>):(
        <VStack bg={"white"} justifyContent={"center"} h={"100vh"}>
          <Button onClick={loginHandler} colorScheme="blue">Sign In with Google</Button>
        </VStack>
      )}
    </Box>
  );
}

export default App;
