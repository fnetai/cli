import SwiftUI
@preconcurrency import WebKit

struct WebView: UIViewRepresentable {
    
    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator // uiDelegate ayarını ekledik
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        if let url = Bundle.main.url(forResource: "fnet/index", withExtension: "html") {
            let baseUrl = Bundle.main.bundleURL
            uiView.loadFileURL(url, allowingReadAccessTo: baseUrl)
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate { // WKUIDelegate protokolünü ekledik
        var parent: WebView

        init(_ parent: WebView) {
            self.parent = parent
        }

        @available(iOS 15, *)
        func webView(
            _ webView: WKWebView,
            requestMediaCapturePermissionFor origin: WKSecurityOrigin,
            initiatedByFrame frame: WKFrameInfo,
            type: WKMediaCaptureType,
            decisionHandler: @escaping (WKPermissionDecision) -> Void
        ) {
            decisionHandler(.grant)
        }
    }
}
