import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { DynamicLayout } from "@/components/DynamicLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";

import { Body } from "@/pages/Body";
import { Contact } from "@/pages/Contact";
import { Pricing } from "@/pages/Pricing";
import { About } from "@/pages/About";
import { Tools } from "@/pages/Tools";
import { Dashboard } from "@/pages/Dashboard";
import { UsageStatistics } from "@/pages/UsageStatistics";
import { APISetup } from "@/pages/APISetup";
import { APIReference } from "@/pages/APIReference";
import { ManagePlans } from "@/pages/ManagePlans";
import { LiveTools } from "@/pages/LiveTools";
import { TermsOfService } from "@/pages/TermsOfService";
import { PrivacyPolicy } from "@/pages/PrivacyPolicy";
import { Support } from "@/pages/Support";
import { SignUp } from "@/pages/SignUp";
import { SignIn } from "@/pages/SignIn";
import { WordToPdfUpload } from "@/pages/upload/WordToPdf";
import { PdfToWordUpload } from "@/pages/upload/PdfToWord";
import { PdfToExcelUpload } from "@/pages/upload/PdfToExcel";
import { ExcelToPdfUpload } from "@/pages/upload/ExcelToPdf";
import { PowerPointToPdfUpload } from "@/pages/upload/PowerPointToPdf";
import { PdfToPowerPointUpload } from "@/pages/upload/PdfToPowerPoint";
import { PdfToImagesUpload } from "@/pages/upload/PdfToImages";
import { ImagesToPdfUpload } from "@/pages/upload/ImagesToPdf";
import { HtmlToPdfUpload } from "@/pages/upload/HtmlToPdf";
import { SplitPdfUpload } from "@/pages/upload/SplitPdf";
import { CompressPdfUpload } from "@/pages/upload/CompressPdf";
import { RotatePdfUpload } from "@/pages/upload/RotatePdf";
import { ResizeImageUpload } from "@/pages/upload/ResizeImage";
import { CropImageUpload } from "@/pages/upload/CropImage";
import { RotateImageUpload } from "@/pages/upload/RotateImage";
import { ConvertImageFormatUpload } from "@/pages/upload/ConvertImageFormat";
import { CompressImageUpload } from "@/pages/upload/CompressImage";
import { UpscaleImageUpload } from "@/pages/upload/UpscaleImage";
import { RemoveBackgroundUpload } from "@/pages/upload/RemoveBackground";
import { MergePdfsUpload } from "@/pages/upload/MergePdfs";
import { UploadDemo } from "@/pages/UploadDemo";
import { Features } from "@/pages/Features";
import { LearnMore } from "@/pages/LearnMore";

function Router() {
  return (
    <Switch>
      {/* Protected Dashboard routes */}
      <Route path="/dashboard">
        <ProtectedRoute requireAuth={true}>
          <DynamicLayout isDashboardPage={true}>
            <Dashboard />
          </DynamicLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/usage">
        <ProtectedRoute requireAuth={true}>
          <DynamicLayout isDashboardPage={true}>
            <UsageStatistics />
          </DynamicLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/api-setup">
        <ProtectedRoute requireAuth={true}>
          <DynamicLayout isDashboardPage={true}>
            <APISetup />
          </DynamicLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/api-reference">
        <ProtectedRoute requireAuth={true}>
          <DynamicLayout isDashboardPage={true}>
            <APIReference />
          </DynamicLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/manage-plans">
        <ProtectedRoute requireAuth={true}>
          <DynamicLayout isDashboardPage={true}>
            <ManagePlans />
          </DynamicLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/live-tools">
        <ProtectedRoute requireAuth={true}>
          <DynamicLayout isDashboardPage={true}>
            <LiveTools />
          </DynamicLayout>
        </ProtectedRoute>
      </Route>

      {/* Public pages with dynamic header based on auth status */}
      <Route path="/">
        <DynamicLayout>
          <Body />
        </DynamicLayout>
      </Route>

      <Route path="/tools">
        <DynamicLayout>
          <Tools />
        </DynamicLayout>
      </Route>

      <Route path="/contact">
        <DynamicLayout>
          <Contact />
        </DynamicLayout>
      </Route>

      <Route path="/pricing">
        <DynamicLayout>
          <Pricing />
        </DynamicLayout>
      </Route>

      <Route path="/about">
        <DynamicLayout>
          <About />
        </DynamicLayout>
      </Route>

      <Route path="/features">
        <DynamicLayout>
          <Features />
        </DynamicLayout>
      </Route>

      <Route path="/learn-more">
        <DynamicLayout>
          <LearnMore />
        </DynamicLayout>
      </Route>

      <Route path="/terms-of-service">
        <DynamicLayout>
          <TermsOfService />
        </DynamicLayout>
      </Route>

      <Route path="/privacy-policy">
        <DynamicLayout>
          <PrivacyPolicy />
        </DynamicLayout>
      </Route>

      <Route path="/support">
        <DynamicLayout>
          <Support />
        </DynamicLayout>
      </Route>

      <Route path="/signup">
        <DynamicLayout>
          <SignUp />
        </DynamicLayout>
      </Route>

      <Route path="/signin">
        <DynamicLayout>
          <SignIn />
        </DynamicLayout>
      </Route>

      {/* Upload pages for tools */}
      <Route path="/upload/word-to-pdf">
        <DynamicLayout>
          <WordToPdfUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload/pdf-to-word">
        <DynamicLayout>
          <PdfToWordUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload/pdf-to-excel">
        <DynamicLayout>
          <PdfToExcelUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload/merge-pdfs">
        <DynamicLayout>
          <MergePdfsUpload />
        </DynamicLayout>
      </Route>

      {/* New PDF conversion tools */}
      <Route path="/upload/excel-to-pdf">
        <DynamicLayout>
          <ExcelToPdfUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload/powerpoint-to-pdf">
        <DynamicLayout>
          <PowerPointToPdfUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload/pdf-to-powerpoint">
        <DynamicLayout>
          <PdfToPowerPointUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload/pdf-to-images">
        <DynamicLayout>
          <PdfToImagesUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload/images-to-pdf">
        <DynamicLayout>
          <ImagesToPdfUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload/html-to-pdf">
        <DynamicLayout>
          <HtmlToPdfUpload />
        </DynamicLayout>
      </Route>

      {/* PDF document management tools */}
      <Route path="/upload/split-pdf">
        <DynamicLayout>
          <SplitPdfUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload/compress-pdf">
        <DynamicLayout>
          <CompressPdfUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload/rotate-pdf">
        <DynamicLayout>
          <RotatePdfUpload />
        </DynamicLayout>
      </Route>

      {/* Image editing tools */}
      <Route path="/upload/resize-image">
        <DynamicLayout>
          <ResizeImageUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload/crop-image">
        <DynamicLayout>
          <CropImageUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload/rotate-image">
        <DynamicLayout>
          <RotateImageUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload/convert-image-format">
        <DynamicLayout>
          <ConvertImageFormatUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload/compress-image">
        <DynamicLayout>
          <CompressImageUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload/upscale-image">
        <DynamicLayout>
          <UpscaleImageUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload/remove-background">
        <DynamicLayout>
          <RemoveBackgroundUpload />
        </DynamicLayout>
      </Route>

      <Route path="/upload-demo">
        <DynamicLayout>
          <UploadDemo />
        </DynamicLayout>
      </Route>

      {/* Fallback to 404 */}
      <Route>
        <DynamicLayout>
          <NotFound />
        </DynamicLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
