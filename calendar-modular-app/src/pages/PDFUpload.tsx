import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { processPDF } from '@/services/pdfProcessor'

export function PDFUpload() {
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setError('')
    } else {
      setError('Please select a valid PDF file')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !user) return

    try {
      setUploading(true)
      setProcessing(true)
      setError('')

      // 1. Upload PDF to Supabase Storage
      const fileExt = 'pdf'
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('pdf-uploads')
        .upload(fileName, selectedFile)

      if (uploadError) throw uploadError

      // 2. Create record in pdf_uploads table
      const { data: uploadRecord, error: dbError } = await supabase
        .from('pdf_uploads')
        .insert({
          user_id: user.id,
          file_name: selectedFile.name,
          file_path: fileName,
          file_size: selectedFile.size,
          processing_status: 'processing'
        })
        .select()
        .single()

      if (dbError) throw dbError

      // 3. Process the PDF with Google Gemini
      const extractedClasses = await processPDF(selectedFile, user.id)

      // 4. Update upload status
      await supabase
        .from('pdf_uploads')
        .update({ 
          processing_status: 'completed',
          extracted_count: extractedClasses.length 
        })
        .eq('id', uploadRecord.id)

      // 5. Navigate to class catalog
      navigate('/catalog')

    } catch (err: any) {
      setError(err.message || 'Failed to process PDF')
      
      // Update status to failed if we have an upload record
      if (user) {
        await supabase
          .from('pdf_uploads')
          .update({ processing_status: 'failed' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
      }
    } finally {
      setUploading(false)
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Your Class Schedule</h1>
          <p className="text-gray-600">
            Upload a PDF of your class schedule and we'll extract all the classes for you.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select PDF File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* File Input */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-upload"
                  disabled={uploading || processing}
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF files only</p>
                </label>
              </div>

              {/* Selected File */}
              {selectedFile && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading || processing}
                className="w-full"
              >
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploading ? 'Uploading...' : processing ? 'Processing PDF...' : 'Upload & Process'}
              </Button>

              {processing && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-600">
                    Processing your PDF with AI... This may take a minute.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Button variant="outline" onClick={() => navigate('/calendar')}>
            Skip for Now
          </Button>
        </div>
      </div>
    </div>
  )
}
