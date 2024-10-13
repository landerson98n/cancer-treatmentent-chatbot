import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TypeAnimation } from 'react-type-animation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SendIcon, Loader2Icon } from 'lucide-react'
import axios from 'axios'

const fetchStudies = async (patientData: string) => {
    const response = await axios.post(`http://127.0.0.1:8000/chat?message=${patientData}`)
    console.log(response);

    return [response.data.study]
}

type Message = {
    text: string
    sender: 'bot' | 'user'
}

type Study = {
    id: string
    inclusionCriteria: string[]
    exclusionCriteria: string[]
}

export default function Component() {
    const [messages, setMessages] = useState<Message[]>([{ text: "Olá! Bem-vindo ao nosso serviço de recomendação de estudos para pacientes com câncer. Como posso ajudar você hoje?", sender: 'bot' }])
    const [input, setInput] = useState('')
    const [stage, setStage] = useState<'greeting' | 'data-collection' | 'processing' | 'results' | 'follow-up' | 'ended'>('greeting')
    const [patientData, setPatientData] = useState('')
    const [studies, setStudies] = useState<Study[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const addMessage = (text: string, sender: 'bot' | 'user') => {
        setMessages(prev => [...prev, { text, sender }])
    }


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (input.trim() === '') return

        addMessage(input, 'user')
        setInput('')

        if (stage === 'greeting') {
            setTimeout(() => {
                addMessage("Por favor, forneça informações sobre seu diagnóstico, histórico médico e quaisquer tratamentos atuais. Essas informações nos ajudarão a encontrar os estudos mais adequados para você.", 'bot')
                setStage('data-collection')
            }, 1000)
        } else if (stage === 'data-collection') {
            setPatientData(input)
            setStage('processing')
            addMessage("Obrigado pelas informações. Estou processando seus dados para encontrar estudos relevantes. Por favor, aguarde um momento.", 'bot')

            try {
                const fetchedStudies = await fetchStudies(input)
                setStudies(fetchedStudies)
                setStage('results')
                addMessage("Encontrei alguns estudos que podem ser relevantes para você. Você pode ver os detalhes na caixa ao lado.", 'bot')
                setTimeout(() => {
                    addMessage("Você gostaria de pesquisar mais estudos ou tem alguma outra pergunta?", 'bot')
                    setStage('follow-up')
                }, 2000)
            } catch (error) {
                addMessage("Desculpe, ocorreu um erro ao buscar os estudos. Por favor, tente novamente mais tarde.", 'bot')
                setStage('greeting')
            }
        } else if (stage === 'follow-up') {
            if (input.toLowerCase().includes('sim') || input.toLowerCase().includes('mais estudos')) {
                addMessage("Entendi que você gostaria de pesquisar mais estudos. Por favor, forneça informações adicionais ou específicas sobre o tipo de estudo que você está procurando.", 'bot')
                setStage('data-collection')
            } else {
                addMessage("Obrigado por usar nosso serviço. Se você tiver mais perguntas no futuro, não hesite em perguntar. Desejo-lhe tudo de bom em sua jornada de saúde!", 'bot')
                setStage('ended')
            }
        }
    }

    const messageVariants = {
        initial: { opacity: 0, y: 50 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -50 }
    }

    return (
        <div className="flex w-full max-w-5xl mx-auto gap-4">
            <Card className={`${studies.length > 0 ? 'w-1/2' : 'w-full'} h-[600px] flex flex-col`}>
                <CardHeader>
                    <CardTitle>Chat de Recomendação de Estudos</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow overflow-auto p-4">
                    <AnimatePresence>
                        {messages.map((message, index) => (
                            <motion.div
                                key={index}
                                variants={messageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className={`mb-4 ${message.sender === 'bot' ? 'text-left' : 'text-right'}`}
                            >
                                <div className={`inline-block p-3 rounded-lg ${message.sender === 'bot' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                                    {message.sender === 'bot' ? (
                                        <TypeAnimation
                                            sequence={[message.text]}
                                            wrapper="span"
                                            speed={70}
                                            style={{ fontSize: '1em', display: 'inline-block' }}
                                            cursor={false}
                                        />
                                    ) : (
                                        message.text
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </CardContent>
                <div className="p-4 border-t">
                    {stage === 'processing' ? (
                        <div className="flex items-center justify-center">
                            <Loader2Icon className="animate-spin mr-2" />
                            <span>Processando...</span>
                        </div>
                    ) : stage === 'data-collection' ? (
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Digite suas informações aqui..."
                            className="mb-2"
                        />
                    ) : stage !== 'ended' ? (
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="mb-2"
                        />
                    ) : null}
                    {stage !== 'ended' && (
                        <Button onClick={handleSend} className="w-full" disabled={stage === 'processing'}>
                            <SendIcon className="mr-2 h-4 w-4" /> Enviar
                        </Button>
                    )}
                </div>
            </Card>

            {studies.length > 0 ? <Card className="w-1/2 h-[600px] overflow-auto">
                <CardHeader>
                    <CardTitle>Estudos Recomendados</CardTitle>
                </CardHeader>
                <CardContent>
                    {studies.length > 0 ? (
                        studies.map((study, index) => (
                            <Accordion type="single" collapsible className="mb-4" key={study.id}>
                                <AccordionItem value={`item-${index}`}>
                                    <AccordionTrigger>
                                        <TypeAnimation
                                            sequence={[study.id]}
                                            wrapper="span"
                                            speed={70}
                                            style={{ fontSize: '1em', display: 'inline-block' }}
                                            cursor={false}
                                        />
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p className="mb-2"><strong>ID do Estudo:</strong> {study.id}</p>
                                        <div className="mb-2">
                                            <strong>Critérios de Inclusão:</strong>
                                            <ul className="list-disc pl-5">
                                                {study.inclusionCriteria.map((criterion, idx) => (
                                                    <li key={idx} className="mb-1">
                                                        <TypeAnimation
                                                            sequence={[criterion]}
                                                            wrapper="span"
                                                            speed={70}
                                                            style={{ fontSize: '0.9em', display: 'inline-block' }}
                                                            cursor={false}
                                                        />
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <strong>Critérios de Exclusão:</strong>
                                            <ul className="list-disc pl-5">
                                                {study.exclusionCriteria.map((criterion, idx) => (
                                                    <li key={idx} className="mb-1">
                                                        <TypeAnimation
                                                            sequence={[criterion]}
                                                            wrapper="span"
                                                            speed={70}
                                                            style={{ fontSize: '0.9em', display: 'inline-block' }}
                                                            cursor={false}
                                                        />
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        ))
                    ) : (
                        <p>Nenhum estudo recomendado ainda. Por favor, forneça suas informações no chat para receber recomendações.</p>
                    )}
                </CardContent>
            </Card> : null}
        </div>
    )
}