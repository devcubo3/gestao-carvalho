"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExportPdfButtonProps {
  reportTitle: string
}

export function ExportPdfButton({ reportTitle }: ExportPdfButtonProps) {
  const { toast } = useToast()

  const handleExportPdf = () => {
    try {
      // Adicionar classe para impressão
      document.body.classList.add('printing')
      
      // Configurar o título do documento
      const originalTitle = document.title
      document.title = `${reportTitle} - ${new Date().toLocaleDateString('pt-BR')}`
      
      // Abrir diálogo de impressão
      window.print()
      
      // Restaurar título original após um pequeno delay
      setTimeout(() => {
        document.title = originalTitle
        document.body.classList.remove('printing')
      }, 100)

      toast({
        title: "PDF preparado",
        description: "Selecione 'Salvar como PDF' na janela de impressão.",
      })
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível preparar o PDF para exportação.",
        variant: "destructive",
      })
    }
  }

  return (
    <Button onClick={handleExportPdf}>
      <Download className="h-4 w-4 mr-2" />
      Exportar PDF
    </Button>
  )
}
