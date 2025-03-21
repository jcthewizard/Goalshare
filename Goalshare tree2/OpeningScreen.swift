//
//  OpeningScreen.swift
//  Goalshare tree2
//
//  Created by Joshua Kim on 12/20/23.
//

import SwiftUI
import FirebaseAuth
import Firebase

struct OpeningScreen: View {
    @EnvironmentObject var viewModel: AccountViewModel
    @ObservedObject private var keyboard = KeyboardResponder()
    @State var userIsLoggedIn = false
    @State var username = ""
    @State var password = ""
    @FocusState var keyboardFocused: Bool
    @State var registering: Bool = false
    @State var loggingIn: Bool = false
    @State var emailAlreadyInUse = false // <-- Here
    @State private var showingErrorAlert = false
    @State private var errorMessage = ""
    @State var userID = ""
    var body: some View {
        if (!registering && !loggingIn) {
            return AnyView(content)
        } else if (registering) {
            return AnyView(registerView)
        }
        else {
            if (userIsLoggedIn) {
                if (viewModel.account == nil) {
                    userIsLoggedIn = false;
                    loggingIn = false;
                    registering = false
                } else {
                    return AnyView(Profile()
                        .environmentObject(viewModel.account!)
                        .environmentObject(viewModel))
                }
            }
        }
        return AnyView(loginScreen)
    }
    var content: some View {
        GeometryReader { geometry in
            VStack(spacing: 0) {
                Spacer()
                Image("Image")
                    .resizable()
                    .frame(width: 150, height: 150)
                Spacer()
                Button {
                    loggingIn = true
                } label: {
                    Text("LOG IN")
                        .font(Font.custom(
                            "Lexend-SemiBold",
                            fixedSize: 28))
                        .padding()
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: geometry.size.height * 0.10)
                        .background(.red)
                    
                }
                Button {
                    registering = true
                } label: {
                    Text("SIGN UP")
                        .font(Font.custom(
                            "Lexend-SemiBold",
                            fixedSize: 28))
                        .offset(y: geometry.size.height * 0.01)
                        .padding(.top)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: geometry.size.height * 0.05)
                        .background(.cyan)
                }
            }
            .frame(maxWidth: /*@START_MENU_TOKEN@*/.infinity/*@END_MENU_TOKEN@*/)
            .background(.yellow)
        }
    }
    var loginScreen: some View {
        loggingInScreen
    }
    var loggingInScreen: some View {
        ZStack {
            VStack {
                HStack {
                    Button {
                        loggingIn = false
                        keyboardFocused = false
                    } label: {
                        Image(systemName: "arrowshape.left.fill")
                            .resizable()
                            .frame(width: 18, height: 15)
                            .foregroundColor(.gray)
                            .padding()
                    }
                    Spacer()
                }
                Text("Goalshare")
                    .font(Font.custom(
                        "Lexend-SemiBold",
                        fixedSize: 64))
                    .foregroundColor(.black)
                    .padding()
                    .cornerRadius(15)
                TextField("Email Address", text: $username)
                    .padding()
                    .focused($keyboardFocused)
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now()) {
                            keyboardFocused = true
                        }
                    }
                
                SecureField("Password", text: $password)
                    .padding()
                Spacer()
            }
            VStack (alignment: .center) {
                Spacer()
                Button {
                    login()
                } label: {
                    Text("Log in")
                        .font(Font.custom(
                            "Lexend-SemiBold",
                            fixedSize: 20))
                        .foregroundColor(.black)
                        .padding(.horizontal, 85.0)
                        .padding(.vertical, 7.0)
                        .background(.yellow)
                        .cornerRadius(35)
                    
                }
                .padding()
                .padding(.bottom, keyboard.currentHeight / 25)
                .edgesIgnoringSafeArea(.bottom)
                //                .animation(.spring(duration: 0.30))
            }
        }
        
    }
    var registerView: some View {
        VStack {
            HStack {
                Button {
                    registering = false;
                    keyboardFocused = false
                } label: {
                    Image(systemName: "arrowshape.left.fill")
                        .resizable()
                        .frame(width: 18, height: 15)
                        .foregroundColor(.gray)
                        .padding()
                }
                Spacer()
            }
            Text("Goalshare")
                .font(.custom("lexend-semiBold", size: 64))
            HStack {
                TextField("Email Address", text: $username)
                    .padding()
                    .focused($keyboardFocused)
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now()) {
                            keyboardFocused = true
                        }
                    }
                if emailAlreadyInUse {
                    Text("*Email in use")
                        .foregroundColor(.red)
                }
            }
            SecureField("Password", text: $password)
                .padding()
            Button {
                register()
            } label: {
                VStack (alignment: .center) {
                    Spacer()
                    Button {
                        login()
                    } label: {
                        Text("Register")
                            .font(Font.custom(
                                "Lexend-SemiBold",
                                fixedSize: 20))
                            .foregroundColor(.black)
                            .padding(.horizontal, 85.0)
                            .padding(.vertical, 7.0)
                            .background(.yellow)
                            .cornerRadius(35)
                        
                    }
                    .padding()
                    .padding(.bottom, keyboard.currentHeight / 25)
                    .edgesIgnoringSafeArea(.bottom)
                }
            }
        }
        .onAppear {
            do {
                try Auth.auth().signOut()
                self.userIsLoggedIn = false
            } catch let signOutError as NSError {
                print("Error signing out: %@", signOutError)
            }
        }
        .onAppear {
            Auth.auth().addStateDidChangeListener { auth, user in
                if user != nil {
                    userIsLoggedIn = true
                }
            }
        }
        
        .alert(isPresented: $showingErrorAlert) {
            Alert(title: Text("Error"), message: Text(errorMessage), dismissButton: .default(Text("OK")))
        }
    }
    func login() {
        Auth.auth().signIn(withEmail: username, password: password) { result, error in
            if let error = error {
                print(error.localizedDescription)
                self.userIsLoggedIn = false // Here
                return
            }
            
            if let user = result?.user {
                loadAccount(userId: user.uid) { result in
                    switch result {
                    case .success(let account):
                        print("Account loaded successfully")
                        self.userIsLoggedIn = true
                        // Do what you want with the loaded account here
                        // e.g., assign it to your view model
                        DispatchQueue.main.async {
                            self.viewModel.account = account
                        }
                    case .failure(let error):
                        print("Error loading account: \(error)")
                        self.userIsLoggedIn = false // And here
                    }
                }
            } else {
                self.userIsLoggedIn = false // And here
            }
        }
    }
    func register() {
        Auth.auth().createUser(withEmail: username, password: password) { authResult, error in
            guard let user = authResult?.user, error == nil else {
                if let err = error as NSError?, err.code == AuthErrorCode.emailAlreadyInUse.rawValue {
                    self.errorMessage = "The email is already in use. Please use a different email."
                    self.showingErrorAlert = true
                } else {
                    self.errorMessage = error?.localizedDescription ?? "Unknown error"
                    self.showingErrorAlert = true
                }
                return
            }
            let db = Firestore.firestore()
            userID = user.uid
            db.collection("accounts").document(user.uid).setData([
                "goals": [],
                "userID": user.uid
            ]) { error in
                if let error = error {
                    print("Error writing document: \(error)")
                    self.userIsLoggedIn = false // And here
                } else {
                    print("Document successfully written!")
                    self.login()
                }
            }
        }
    }
}

#Preview {
    OpeningScreen()
        .environmentObject(AccountViewModel())
}
