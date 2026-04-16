import SwiftUI
import Speech

struct ContentView: View {
    @State private var isSpeechAuthorized = false
    
    var body: some View {
        WebView()
            .padding(.vertical, -60.0)
            .edgesIgnoringSafeArea(.all)
            .onAppear(perform: requestSpeechAuthorization)
    }
    
    func requestSpeechAuthorization() {
        SFSpeechRecognizer.requestAuthorization { authStatus in
            DispatchQueue.main.async {
                switch authStatus {
                case .authorized:
                    self.isSpeechAuthorized = true
                default:
                    self.isSpeechAuthorized = false
                }
            }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}