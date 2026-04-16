import SwiftUI
import WebKit

struct WebView: NSViewRepresentable {
    
    func makeNSView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.navigationDelegate = context.coordinator
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {
        if let url = Bundle.main.url(forResource: "fnet/index", withExtension: "html") {
            let baseUrl = Bundle.main.bundleURL
            nsView.loadFileURL(url, allowingReadAccessTo: baseUrl)
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, WKNavigationDelegate {
        var parent: WebView

        init(_ parent: WebView) {
            self.parent = parent
        }
    }
}
