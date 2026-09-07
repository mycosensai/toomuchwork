import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { trpc } from '@/providers/trpc'
import { validateFile, validateMagicBytes } from '@/lib/fileValidation'
import {
  Diamond, Sparkles, Loader2, TrendingUp, BarChart3, FileSearch, ImageIcon, X, AlertCircle, Lock, CheckCircle2, ShieldCheck
} from 'lucide-react'
import StripeCheckoutWidget from '@/components/StripeCheckoutWidget'
import JsonLd, { serviceSchema, faqSchema } from '@/components/JsonLd'

export default function Appraisal() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [step, setStep] = useState<'form' | 'loading' | 'done'>('form')
  const [itemName, setItemName] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('good')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageValidating, setImageValidating] = useState(false)
  const [justCreatedId, setJustCreatedId] = useState<number | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // If ?appraisalId=N&pending=1 is present we just ran an appraisal and are
  // showing the unlocked (paid) result; otherwise we show the create form.
  const resultId = Number(params.get('appraisalId') || 0)
  const viewingResult = !!resultId && !isNaN(resultId) && resultId > 0
  const unlockedMode = viewingResult && params.get('pending') !== '1'

  const { data: categories } = trpc.categories.list.useQuery()
  const { data: appraisal, isLoading, refetch } = trpc.appraisal.getById.useQuery(
    { id: resultId },
    { enabled: viewingResult }
  )

  const createAppraisal = trpc.appraisal.create.useMutation({
    onSuccess: (data) => {
      if (data.id) {
        setJustCreatedId(data.id)
        setStep('done')
        // Go to the result screen in "pending/unlocked by payment" state so
        // the paywall gates it until payment lands.
        navigate(`/appraisal?appraisalId=${data.id}&pending=1`)
      } else {
        setStep('form')
      }
    },
    onError: (error) => {
      if (error.message.includes('Image validation failed')) {
        setImageError(error.message)
      }
      setStep('form')
    },
  })

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError(null)
    setImageValidating(true)
    const basicValidation = validateFile(file)
    if (!basicValidation.valid) {
      setImageError(basicValidation.error!)
      setImageValidating(false)
      e.target.value = ''
      return
    }
    const magicValidation = await validateMagicBytes(file)
    if (!magicValidation.valid) {
      setImageError(magicValidation.error!)
      setImageValidating(false)
      e.target.value = ''
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
    setImageValidating(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName || !category) return
    setImageError(null)
    setStep('loading')
    createAppraisal.mutate({
      itemName,
      category,
      condition,
      description,
      imageUrl: imagePreview || undefined,
    })
  }

  // Poll the result until the report is ready (completed) so the page can
  // transition smoothly into the locked/paid states.
  useEffect(() => {
    if (viewingResult && appraisal && appraisal.status === 'pending' && appraisal.locked) {
      const t = setInterval(() => refetch(), 4000)
      return () => clearInterval(t)
    }
  }, [viewingResult, appraisal, refetch])

  const conditions = [
    { value: 'mint', label: 'Mint' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'very_good', label: 'Very Good' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
  ]

  const isLocked = viewingResult && appraisal?.locked === true
  const isUnlocked = viewingResult && appraisal?.locked === false && appraisal?.paid === true
  const loadingResult = viewingResult && isLoading

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Structured data for search + AI answer engines */}
      <JsonLd schema={serviceSchema({
        name: 'AI Appraisal Report',
        description: 'AI-powered value appraisal for luxury collectibles — estimated value range, condition and authenticity readout, market analysis, and comparable bands.',
        price: '29.00',
      })} />
      <JsonLd schema={faqSchema([
        { q: 'How much does an AI Appraisal cost?', a: 'A one-time payment of $29 unlocks your full AI appraisal report. No subscription.' },
        { q: 'What does the appraisal include?', a: 'Your report includes an estimated value with a low–high range, condition and authenticity readout, market analysis with comparable bands, and factors increasing or decreasing value.' },
        { q: 'Is the AI appraisal a certified valuation?', a: 'No. The report is an AI-generated estimate for informational purposes only. For insurance, legal, or verified sale pricing, consult a licensed professional appraiser.' },
        { q: 'How long does an appraisal take?', a: 'Analysis typically completes within a minute of submission. The full report unlocks immediately after your one-time payment.' },
      ])} />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[9px] tracking-[5px] uppercase text-[#C9A84C] font-medium mb-3">
            AI-Powered Analysis
          </p>
          <h1 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5EED8] tracking-[4px]">
            Appraisal Machine
          </h1>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#C9A84C]" />
            <Diamond className="w-1.5 h-1.5 text-[#C9A84C] rotate-45" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#C9A84C]" />
          </div>
          <p className="font-cormorant italic text-base text-[#C8BC98] mt-4 max-w-xl mx-auto">
            Our AI analyzes your item description and photo against its training knowledge of market trends and collectible pricing. It provides an estimated range — not a guaranteed valuation. For insurance or legal purposes, consult a licensed appraiser.
          </p>
        </div>

        {/* Create form */}
        {!viewingResult && step === 'form' && (
          <form onSubmit={handleSubmit} className="bg-[#161616] border border-[#C9A84C]/25 p-8 sm:p-10 relative">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C9A84C]" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C9A84C]" />

            {/* Upload */}
            <div className="mb-8">
              <label className="block text-[9px] tracking-[4px] uppercase text-[#C9A84C] mb-3">Upload Photo</label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`relative border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
                  imagePreview ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                  : imageError ? 'border-red-500 bg-red-500/5'
                  : 'border-[#C9A84C]/30 bg-[#1E1E1E] hover:border-[#C9A84C]/60'
                }`}
                style={{ height: '280px' }}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                ) : imageError ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                    <p className="text-xs text-red-400 mb-1">{imageError}</p>
                    <p className="text-[10px] text-[#8A6E2F]">Click to try again</p>
                  </div>
                ) : imageValidating ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin mb-3" />
                    <p className="text-xs text-[#C8BC98]">Validating image...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <ImageIcon className="w-10 h-10 text-[#C9A84C]/40 mb-3" />
                    <p className="text-xs text-[#C8BC98] mb-1">Click to upload a photo</p>
                    <p className="text-[10px] text-[#8A6E2F]">JPG, PNG, WebP, GIF up to 10MB</p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={imageValidating}
                />
              </div>
              {(imagePreview || imageError) && (
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); setImageError(null) }}
                  className="mt-2 flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300"
                  disabled={imageValidating}
                >
                  <X className="w-3 h-3" /> Remove image
                </button>
              )}
            </div>

            {/* Item Name */}
            <div className="mb-6">
              <label className="block text-[9px] tracking-[4px] uppercase text-[#C9A84C] mb-3">Item Name</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., 1924 Art Deco Diamond Ring"
                className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-3.5 px-5 outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#8A6E2F]"
                required
              />
            </div>

            {/* Category */}
            <div className="mb-6">
              <label className="block text-[9px] tracking-[4px] uppercase text-[#C9A84C] mb-3">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-3.5 px-5 outline-none focus:border-[#C9A84C] transition-colors cursor-pointer"
                required
              >
                <option value="" className="bg-[#1E1E1E]">Select a category</option>
                {(categories || []).map((cat) => (
                  <option key={cat.id} value={cat.name} className="bg-[#1E1E1E]">{cat.name}</option>
                ))}
                <option value="Other" className="bg-[#1E1E1E]">Other / Not Sure</option>
              </select>
            </div>

            {/* Condition */}
            <div className="mb-6">
              <label className="block text-[9px] tracking-[4px] uppercase text-[#C9A84C] mb-3">Condition</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {conditions.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCondition(c.value)}
                    className={`py-3 text-[10px] tracking-[2px] uppercase border transition-all ${
                      condition === c.value
                        ? 'border-[#C9A84C] bg-[#C9A84C]/12 text-[#C9A84C]'
                        : 'border-[#C9A84C]/15 text-[#C8BC98] hover:border-[#C9A84C]/40'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <label className="block text-[9px] tracking-[4px] uppercase text-[#C9A84C] mb-3">Additional Details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include maker marks, hallmarks, provenance, measurements, certificates, year of production..."
                rows={5}
                className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-3.5 px-5 outline-none focus:border-[#C9A84C] transition-colors resize-none placeholder:text-[#8A6E2F]"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={createAppraisal.isPending}
              className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] font-cinzel text-[11px] tracking-[3px] uppercase font-bold hover:shadow-[0_0_40px_rgba(201,168,76,0.4)] transition-all disabled:opacity-60"
            >
              {createAppraisal.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Get AI Appraisal
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-[#8A6E2F] mt-4 tracking-[1px]">
              <Lock className="w-3 h-3 inline mr-1" />
              $29 one-time unlocks your full report — no subscription
            </p>
          </form>
        )}

        {/* Loading state */}
        {!viewingResult && step === 'loading' && (
          <div className="bg-[#161616] border border-[#C9A84C]/25 p-16 text-center relative">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C9A84C]" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C9A84C]" />
            <div className="relative inline-block mb-8">
              <div className="w-20 h-20 border-2 border-[#C9A84C]/15 rotate-45 flex items-center justify-center" />
              <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-[#C9A84C] animate-spin" />
            </div>
            <h3 className="font-cinzel text-lg text-[#C9A84C] tracking-[4px] uppercase mb-3">Analyzing Your Item</h3>
            <p className="text-sm text-[#C8BC98] font-light max-w-md mx-auto mb-6">
              Our AI is analyzing your item description and image against its training knowledge of collectible markets. It does not access live databases...
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 text-[10px] text-[#8A6E2F]">
                <FileSearch className="w-3 h-3" /><span>Researching comparable sales</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[#8A6E2F]">
                <BarChart3 className="w-3 h-3" /><span>Analyzing market data</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[#8A6E2F]">
                <TrendingUp className="w-3 h-3" /><span>Calculating estimate</span>
              </div>
            </div>
          </div>
        )}

        {/* Result view (locked → paywall unlock → full report) */}
        {viewingResult && loadingResult && (
          <div className="bg-[#161616] border border-[#C9A84C]/25 p-16 text-center">
            <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#C8BC98]">Loading your appraisal…</p>
          </div>
        )}

        {viewingResult && isLocked && appraisal && (
          <div className="bg-[#161616] border border-[#C9A84C]/25 p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C9A84C]" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C9A84C]" />
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 border border-[#C9A84C]/30 rotate-45 flex items-center justify-center" />
                <Lock className="absolute inset-0 m-auto w-6 h-6 text-[#C9A84C]" />
              </div>
            </div>
            <h3 className="font-cinzel text-lg text-[#C9A84C] tracking-[3px] uppercase mb-2">
              Your appraisal is ready
            </h3>
            <p className="text-sm text-[#C8BC98] max-w-md mx-auto mb-2">
              We've analyzed <span className="text-[#F5EED8]">{appraisal.itemName}</span>. The full report —
              value range, condition assessment, market analysis, and comparables — unlocks for a one-time payment.
            </p>
            <p className="text-[10px] text-[#8A6E2F] tracking-[2px] uppercase mb-8">
              Estimated value preview: <span className="text-[#C9A84C]">locked</span>
            </p>

            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 py-3.5 px-10 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] font-cinzel text-[11px] tracking-[3px] uppercase font-bold hover:shadow-[0_0_40px_rgba(201,168,76,0.4)] transition-all"
            >
              <Lock className="w-4 h-4" /> Unlock Full Report — $29
            </button>
            <div className="flex items-center justify-center gap-4 mt-5 text-[9px] text-[#8A6E2F] tracking-[1px]">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-[#C9A84C]/70" /> Secure Stripe payment</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[#C9A84C]/70" /> Instant unlock</span>
              <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-[#C9A84C]/70" /> One-time · no subscription</span>
            </div>
          </div>
        )}

        {viewingResult && isUnlocked && appraisal && (
          <div className="bg-[#161616] border border-[#C9A84C]/25 p-8 sm:p-12">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-5 h-5 text-[#C9A84C]" />
              <h3 className="font-cinzel text-xl text-[#C9A84C] tracking-[3px] uppercase">
                Appraisal Report — {appraisal.itemName}
              </h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="border border-[#C9A84C]/20 bg-[#1E1E1E] p-5 text-center">
                <p className="text-[9px] tracking-[3px] uppercase text-[#8A6E2F] mb-1">Estimated Value</p>
                <p className="font-cinzel text-3xl text-[#C9A84C] font-bold">
                  ${Number(appraisal.estimatedValue || 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-[#8A6E2F] mt-1">
                  Range ${Number(appraisal.valueRangeLow || 0).toLocaleString()} — ${Number(appraisal.valueRangeHigh || 0).toLocaleString()}
                </p>
              </div>
              <div className="border border-[#C9A84C]/20 bg-[#1E1E1E] p-5">
                <p className="text-[9px] tracking-[3px] uppercase text-[#8A6E2F] mb-2">Confidence</p>
                <p className="text-sm text-[#F5EED8] capitalize">{appraisal.confidence}</p>
                <p className="text-[9px] tracking-[3px] uppercase text-[#8A6E2F] mt-3 mb-2">Authenticity</p>
                <p className="text-sm text-[#F5EED8] capitalize">{appraisal.authenticityVerdict || 'not assessed'}</p>
              </div>
            </div>
            {(appraisal.conditionAssessment || appraisal.marketAnalysis) && (
              <div className="space-y-4 mb-6">
                {appraisal.conditionAssessment && (
                  <div className="border border-[#C9A84C]/15 bg-[#1E1E1E] p-4">
                    <p className="text-[9px] tracking-[3px] uppercase text-[#8A6E2F] mb-2">Condition Assessment</p>
                    <p className="text-sm text-[#C8BC98]">{appraisal.conditionAssessment}</p>
                  </div>
                )}
                {appraisal.marketAnalysis && (
                  <div className="border border-[#C9A84C]/15 bg-[#1E1E1E] p-4">
                    <p className="text-[9px] tracking-[3px] uppercase text-[#8A6E2F] mb-2">Market Analysis</p>
                    <p className="text-sm text-[#C8BC98]">{appraisal.marketAnalysis}</p>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => navigate('/sell')}
                className="py-3 px-8 border border-[#C9A84C]/40 text-[#C9A84C] font-cinzel text-[10px] tracking-[3px] uppercase hover:bg-[#C9A84C]/10 transition-all"
              >
                List this item for sale
              </button>
            </div>
          </div>
        )}

        {viewingResult && isLocked && showPaywall && (
          <StripeCheckoutWidget
            type="appraisal"
            targetId={resultId}
            itemName={appraisal?.itemName}
            onUnlocked={() => { setShowPaywall(false); refetch() }}
            trigger="auto"
          />
        )}
      </div>
    </div>
  )
}
