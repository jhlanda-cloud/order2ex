import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function AuthPage() {
  const navigate = useNavigate()

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupError, setSignupError] = useState('')

  const handleLogin = async () => {
    setLoginError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })
    if (error) {
      setLoginError(error.message)
      return
    }
    navigate('/')
  }

  const handleSignup = async () => {
    setSignupError('')
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
    })
    if (error) {
      setSignupError(error.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-sm p-4">
      <Tabs defaultValue="login">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">로그인</TabsTrigger>
          <TabsTrigger value="signup">회원가입</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="login-email">이메일</Label>
            <Input
              id="login-email"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="login-password">비밀번호</Label>
            <Input
              id="login-password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
          </div>
          {loginError && <p className="text-sm text-destructive">{loginError}</p>}
          <Button onClick={handleLogin}>로그인</Button>
        </TabsContent>

        <TabsContent value="signup" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="signup-email">이메일</Label>
            <Input
              id="signup-email"
              type="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="signup-password">비밀번호</Label>
            <Input
              id="signup-password"
              type="password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
            />
          </div>
          {signupError && <p className="text-sm text-destructive">{signupError}</p>}
          <Button onClick={handleSignup}>회원가입</Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}
